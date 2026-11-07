const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function nested_object(livr, ruleBuilders) {
  // ruleBuilders is the last argument: the arguments after the schema are ignored
  if (arguments.length > 2) ruleBuilders = arguments[arguments.length - 1];

  const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

  return async (nestedObject, params, outputArr) => {
    if (util.isNoValue(nestedObject)) return;
    if (!util.isObject(nestedObject)) return 'FORMAT_ERROR';

    try {
      const result = await validator.validate(nestedObject);
      outputArr.push(result);
      return;
    } catch (errors) {
      return errors;
    }
  };
}

module.exports = nested_object;
