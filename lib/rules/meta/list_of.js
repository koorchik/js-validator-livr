const Validator = require('../../Validator');
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
  const validator = new Validator(livr).registerRules(ruleBuilders).prepare();
  const validateItem = validator.getFieldRule('field');

  return (values, params, outputArr) => {
    if (util.isNoValue(values)) return;

    if (!Array.isArray(values)) return 'FORMAT_ERROR';

    const results = [];
    const errors = [];
    let hasErrors = false;

    for (const value of values) {
      // validateItem() pushes the output of a valid item to results if the rules change it
      const resultsLength = results.length;
      const errCode = validateItem(value, NO_FIELDS, results);

      if (errCode) {
        hasErrors = true;
        errors.push(errCode);
        results.push(null);
      } else {
        if (results.length === resultsLength) results.push(value);
        errors.push(null);
      }
    }

    if (hasErrors) {
      return errors;
    } else {
      outputArr.push(results);
      return;
    }
  };
}

module.exports = list_of;
