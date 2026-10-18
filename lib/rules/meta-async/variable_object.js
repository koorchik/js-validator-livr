const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function variable_object(selectorField, livrs, ruleBuilders) {
  // Map, so that selector values like "constructor" or "__proto__" do not match Object.prototype
  const validators = new Map();

  for (const selectorValue in livrs) {
    const validator = new AsyncValidator(livrs[selectorValue])
      .registerRules(ruleBuilders)
      .prepare();
    validators.set(selectorValue, validator);
  }

  return async (object, params, outputArr) => {
    if (util.isNoValue(object)) return;

    // The selector value must be a primitive value listed in livrs
    const selectorValue = util.isObject(object) ? object[selectorField] : undefined;
    const validator =
      selectorValue && util.isPrimitiveValue(selectorValue)
        ? validators.get(String(selectorValue))
        : undefined;

    if (!validator) return 'FORMAT_ERROR';

    try {
      const result = await validator.validate(object);
      outputArr.push(result);
      return;
    } catch (errors) {
      return errors;
    }
  };
}

module.exports = variable_object;
