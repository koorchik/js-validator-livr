const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

// Items have no containing object: a reference in their rules (required_if, when) is a missing
// value. Frozen, so that no rule can add fields to it
const NO_FIELDS = Object.freeze({});

// A rest parameter instead of slicing `arguments`, which is slow
function list_of(...args) {
  // ruleBuilders is the last argument. With a list of rules, the arguments after it are ignored
  const ruleBuilders = args.pop();
  const rules = Array.isArray(args[0]) ? args[0] : args;

  const livr = { field: rules };
  const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();
  const validateItem = validator.getFieldRule('field');

  return (values, params, outputArr) => {
    if (util.isNoValue(values)) return;

    if (!Array.isArray(values)) return 'FORMAT_ERROR';

    const state = { results: [], errors: [], hasErrors: false };
    return validateItems(validateItem, values, 0, state, outputArr);
  };
}

// Validates the items from #start. Stays synchronous while the item rules return plain values,
// and returns a promise only once some item rule returns one.
function validateItems(validateItem, values, start, state, outputArr) {
  for (let i = start; i < values.length; i++) {
    const value = values[i];
    const resultsLength = state.results.length;
    let errCode;

    try {
      // validateItem() pushes the output of a valid item to results if the rules change it
      errCode = validateItem(value, NO_FIELDS, state.results);
    } catch (error) {
      addItemError(state, error);
      continue;
    }

    if (util.isThenable(errCode)) {
      return Promise.resolve(errCode).then(
        asyncErrCode => {
          addItemOutcome(state, asyncErrCode, value, resultsLength);
          return validateItems(validateItem, values, i + 1, state, outputArr);
        },
        error => {
          addItemError(state, error);
          return validateItems(validateItem, values, i + 1, state, outputArr);
        }
      );
    }

    addItemOutcome(state, errCode, value, resultsLength);
  }

  if (state.hasErrors) return state.errors;

  outputArr.push(state.results);
  return;
}

function addItemOutcome(state, errCode, value, resultsLength) {
  if (errCode) {
    addItemError(state, errCode);
  } else {
    // The item rules did not change the value
    if (state.results.length === resultsLength) state.results.push(value);
    state.errors.push(null);
  }
}

// Also for exceptions of rules: an exception is the error of the item, like in list_of_objects
function addItemError(state, errCode) {
  state.hasErrors = true;
  state.errors.push(errCode);
  state.results.push(null);
}

module.exports = list_of;
