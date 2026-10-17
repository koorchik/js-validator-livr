const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function list_of_different_objects(selectorField, livrs, ruleBuilders) {
    // Map, so that selector values like "constructor" or "__proto__" do not match Object.prototype
    const validators = new Map();

    for (const selectorValue in livrs) {
        const validator = new AsyncValidator(livrs[selectorValue])
            .registerRules(ruleBuilders)
            .prepare();
        validators.set(selectorValue, validator);
    }

    return async (objects, params, outputArr) => {
        if (util.isNoValue(objects)) return;
        if (!Array.isArray(objects)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];
        let hasErrors = false;

        for (const object of objects) {
            // The selector value must be a primitive value listed in livrs
            const selectorValue = util.isObject(object) ? object[selectorField] : undefined;
            const validator =
                selectorValue && util.isPrimitiveValue(selectorValue)
                    ? validators.get(String(selectorValue))
                    : undefined;

            if (!validator) {
                hasErrors = true;
                errors.push('FORMAT_ERROR');
                continue;
            }

            let outcome;
            try {
                outcome = validator._validateMaybeSync(object);
                if (outcome instanceof Promise) outcome = await outcome;
            } catch (caughtErrors) {
                outcome = { errors: caughtErrors };
            }

            if (!outcome.result) {
                hasErrors = true;
                errors.push(outcome.errors);
                results.push(null);
            } else {
                results.push(outcome.result);
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

module.exports = list_of_different_objects;