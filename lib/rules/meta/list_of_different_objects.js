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
            const result = validator.validate(object);

            if (result) {
                results.push(result);
                errors.push(null);
            } else {
                hasErrors = true;
                errors.push(validator.getErrors());
                results.push(null);
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