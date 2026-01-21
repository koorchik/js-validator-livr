const Validator = require('../../Validator');
const util = require('../../util');

function list_of_different_objects(selectorField, livrs, ruleBuilders) {
    const validators = {};

    for (const selectorValue in livrs) {
        const validator = new Validator(livrs[selectorValue])
            .registerRules(ruleBuilders)
            .prepare();
        validators[selectorValue] = validator;
    }

    return (objects, params, outputArr) => {
        if (util.isNoValue(objects)) return;
        if (!Array.isArray(objects)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];

        for (const object of objects) {
            if (typeof object != 'object') {
                errors.push('FORMAT_ERROR');
                continue;
            }
            if (!object[selectorField]) {
                errors.push({ [selectorField]: 'REQUIRED' });
                continue;
            }
            if (!validators[object[selectorField]]) {
                errors.push({ [selectorField]: 'NOT_ALLOWED_VALUE' });
                continue;
            }

            const validator = validators[object[selectorField]];
            const result = validator.validate(object);

            if (result) {
                results.push(result);
                errors.push(null);
            } else {
                errors.push(validator.getErrors());
                results.push(null);
            }
        }

        const hasErrors = errors.some((e) => e !== null);

        if (hasErrors) {
            return errors;
        } else {
            outputArr.push(results);
            return;
        }
    };
}

module.exports = list_of_different_objects;
