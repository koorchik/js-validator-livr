const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

// Keys have no containing object: a reference in their rules (required_if, when) is a missing
// value. Frozen, so that no rule can add fields to it
const NO_FIELDS = Object.freeze({});

// A rest parameter instead of slicing `arguments`, which is slow.
// The arguments are the same as in list_of: keys({ one_of: ['uk', 'en'] }),
// keys('required', { max_length: 2 }) or keys(['required', { max_length: 2 }])
function keys(...args) {
  // ruleBuilders is the last argument. With a list of rules, the arguments after it are ignored
  const ruleBuilders = args.pop();
  const rules = Array.isArray(args[0]) ? args[0] : args;

  if (rules.length === 0) {
    throw new Error('LIVR: "keys" needs rules');
  }

  const livr = { field: rules };
  // Keys are checked as they are: no autoTrim, even when it is the default
  const validator = new AsyncValidator(livr, { autoTrim: false });
  validator.registerRules(ruleBuilders).prepare();
  const validateKey = validator.getFieldRule('field');

  return (object, params, outputArr) => {
    if (util.isNoValue(object)) return;

    if (!util.isObject(object)) return 'FORMAT_ERROR';

    // Own keys only. Keys like "constructor" or "__proto__" are checked like any other key.
    // The rules only check: their output is ignored and the value stays unchanged
    const state = { keys: Object.keys(object), errors: null };
    return validateKeys(validateKey, 0, state);
  };
}

// Validates the keys from #start. Stays synchronous while the rules return plain values,
// and returns a promise only once some rule returns one.
function validateKeys(validateKey, start, state) {
  for (let i = start; i < state.keys.length; i++) {
    const key = state.keys[i];
    let errCode;

    try {
      errCode = validateKey(key, NO_FIELDS, []);
    } catch (error) {
      // An exception of a rule is the error of the key, like in values
      addKeyError(state, key, error);
      continue;
    }

    if (util.isThenable(errCode)) {
      return Promise.resolve(errCode).then(
        asyncErrCode => {
          if (asyncErrCode) addKeyError(state, key, 'WRONG_KEY');
          return validateKeys(validateKey, i + 1, state);
        },
        error => {
          addKeyError(state, key, error);
          return validateKeys(validateKey, i + 1, state);
        }
      );
    }

    if (errCode) addKeyError(state, key, 'WRONG_KEY');
  }

  return state.errors === null ? undefined : state.errors;
}

function addKeyError(state, key, errCode) {
  if (state.errors === null) state.errors = {};
  setOwn(state.errors, key, errCode);
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

module.exports = keys;
