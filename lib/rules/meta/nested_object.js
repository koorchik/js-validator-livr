const Validator = require('../../Validator');
const util = require('../../util');

function nested_object(livr, ruleBuilders) {
  // ruleBuilders is the last argument: the arguments after the schema are ignored
  if (arguments.length > 2) ruleBuilders = arguments[arguments.length - 1];

  const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

  return (nestedObject, params, outputArr) => {
    if (util.isNoValue(nestedObject)) return;
    if (!util.isObject(nestedObject)) return 'FORMAT_ERROR';

    const result = validator.validate(nestedObject);

    if (result) {
      outputArr.push(result);
      return;
    } else {
      return validator.getErrors();
    }
  };
}

module.exports = nested_object;
