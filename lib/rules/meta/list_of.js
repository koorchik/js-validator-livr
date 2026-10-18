const Validator = require('../../Validator');
const util = require('../../util');

// A rest parameter instead of slicing `arguments`, which is slow
function list_of(...args) {
  let rules = args[0];
  let ruleBuilders = args[1];

  if (!Array.isArray(rules)) {
    rules = args;
    ruleBuilders = rules.pop();
  }

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
      // Rules of an item see it as the only field of the data, like in validate().
      // validateItem() pushes the output of a valid item to results if the rules change it
      const resultsLength = results.length;
      const errCode = validateItem(value, { field: value }, results);

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
