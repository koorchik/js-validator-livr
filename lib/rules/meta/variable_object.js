const Validator = require('../../Validator');
const util = require('../../util');

function variable_object(selectorField, livrs, ruleBuilders) {
  // Map, so that selector values like "constructor" or "__proto__" do not match Object.prototype
  const validators = new Map();

  for (const selectorValue in livrs) {
    const validator = new Validator(livrs[selectorValue]).registerRules(ruleBuilders).prepare();
    validators.set(selectorValue, validator);
  }

  return (object, params, outputArr) => {
    if (util.isNoValue(object)) return;

    // The selector value must be a primitive value listed in livrs
    const selectorValue = util.isObject(object) ? object[selectorField] : undefined;
    const validator =
      selectorValue && util.isPrimitiveValue(selectorValue)
        ? validators.get(String(selectorValue))
        : undefined;

    if (!validator) return 'FORMAT_ERROR';

    const result = validator.validate(object);

    if (result) {
      outputArr.push(result);
      return;
    } else {
      return validator.getErrors();
    }
  };
}

module.exports = variable_object;
