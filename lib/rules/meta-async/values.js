const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

// Values have no containing object: a reference in their rules (required_if, when) is a missing
// value. Frozen, so that no rule can add fields to it
const NO_FIELDS = Object.freeze({});

// A rest parameter instead of slicing `arguments`, which is slow.
// The arguments are the same as in list_of: values('string'), values('required', 'string')
// or values(['required', 'string'])
function values(...args) {
  // ruleBuilders is the last argument. With a list of rules, the arguments after it are ignored
  const ruleBuilders = args.pop();
  const rules = Array.isArray(args[0]) ? args[0] : args;

  if (rules.length === 0) {
    throw new Error('LIVR: "values" needs rules');
  }

  const livr = { field: rules };
  const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();
  const validateValue = validator.getFieldRule('field');

  return (object, params, outputArr) => {
    if (util.isNoValue(object)) return;

    if (!util.isObject(object)) return 'FORMAT_ERROR';

    // Own keys only. Keys like "constructor" or "__proto__" are data here
    const state = { object, keys: Object.keys(object), result: {}, errors: null };
    return validateValues(validateValue, 0, state, outputArr);
  };
}

// Validates the values from key #start. Stays synchronous while the rules return plain values,
// and returns a promise only once some rule returns one.
function validateValues(validateValue, start, state, outputArr) {
  for (let i = start; i < state.keys.length; i++) {
    const key = state.keys[i];
    const value = state.object[key];
    const valueOutput = [];
    let errCode;

    try {
      errCode = validateValue(value, NO_FIELDS, valueOutput);
    } catch (error) {
      // An exception of a rule is the error of the value, like in list_of
      addOutcome(state, key, error, value, valueOutput);
      continue;
    }

    if (util.isThenable(errCode)) {
      return Promise.resolve(errCode).then(
        asyncErrCode => {
          addOutcome(state, key, asyncErrCode, value, valueOutput);
          return validateValues(validateValue, i + 1, state, outputArr);
        },
        error => {
          addOutcome(state, key, error, value, valueOutput);
          return validateValues(validateValue, i + 1, state, outputArr);
        }
      );
    }

    addOutcome(state, key, errCode, value, valueOutput);
  }

  if (state.errors !== null) return state.errors;

  outputArr.push(state.result);
}

function addOutcome(state, key, errCode, value, valueOutput) {
  if (errCode) {
    if (state.errors === null) state.errors = {};
    setOwn(state.errors, key, errCode);
  } else if (state.errors === null) {
    setOwn(state.result, key, valueOutput.length !== 0 ? valueOutput[0] : value);
  }
}

// obj[key] = value, also for the key "__proto__", which would set the prototype otherwise
function setOwn(obj, key, value) {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  } else {
    obj[key] = value;
  }
}

module.exports = values;
