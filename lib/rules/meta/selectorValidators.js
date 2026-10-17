const util = require('../../util');

// Helpers for variable_object and list_of_different_objects (sync and async versions), not a rule

// Builds a validator for every selector value. A Map, so that selector values like
// "constructor" or "__proto__" do not match Object.prototype
function buildSelectorValidators(ValidatorClass, livrs, ruleBuilders) {
    const validators = new Map();

    for (const selectorValue in livrs) {
        const validator = new ValidatorClass(livrs[selectorValue])
            .registerRules(ruleBuilders)
            .prepare();
        validators.set(selectorValue, validator);
    }

    return validators;
}

// Returns the validator for the object, or undefined when it is not an object
// or its selector value is not a primitive value listed in livrs
function findSelectorValidator(validators, object, selectorField) {
    if (!util.isObject(object)) return;

    const selectorValue = object[selectorField];
    if (!selectorValue || !util.isPrimitiveValue(selectorValue)) return;

    return validators.get(String(selectorValue));
}

module.exports = { buildSelectorValidators, findSelectorValidator };
