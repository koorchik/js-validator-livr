const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function list_of_different_objects(selectorField, livrs, ruleBuilders) {
    const validators = {};

    for (const selectorValue in livrs) {
        const validator = new AsyncValidator(livrs[selectorValue])
            .registerRules(ruleBuilders)
            .prepare();
        validators[selectorValue] = validator;
    }

    return async (objects, params, outputArr) => {
        if (util.isNoValue(objects)) return;
        if (!Array.isArray(objects)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];
        let hasErrors = false;

        for (const object of objects) {
            if (
                typeof object != 'object' ||
                !object[selectorField] ||
                !validators[object[selectorField]]
            ) {
                errors.push('FORMAT_ERROR');
                continue;
            }

            const validator = validators[object[selectorField]];

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