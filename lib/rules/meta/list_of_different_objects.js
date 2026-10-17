const Validator = require('../../Validator');
const util = require('../../util');
const { buildSelectorValidators, findSelectorValidator } = require('./selectorValidators');

function list_of_different_objects(selectorField, livrs, ruleBuilders) {
    const validators = buildSelectorValidators(Validator, livrs, ruleBuilders);

    return (objects, params, outputArr) => {
        if (util.isNoValue(objects)) return;
        if (!Array.isArray(objects)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];
        let hasErrors = false;

        for (const object of objects) {
            const validator = findSelectorValidator(validators, object, selectorField);

            if (!validator) {
                hasErrors = true;
                errors.push('FORMAT_ERROR');
                continue;
            }

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