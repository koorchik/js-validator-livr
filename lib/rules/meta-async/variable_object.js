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

        let outcome;
        try {
            outcome = validator._validateMaybeSync(object);
            if (outcome instanceof Promise) outcome = await outcome;
        } catch (errors) {
            outcome = { errors };
        }

        if (!outcome.result) return outcome.errors;

        outputArr.push(outcome.result);
        return;
    };
}

module.exports = variable_object;
