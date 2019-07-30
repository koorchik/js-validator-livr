const Validator = require('../../Validator');
const util = require('../../util');

function list_of_objects(livr, ruleBuilders) {
    const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

    return (objects, params, outputArr) => {
        if (util.isNoValue(objects)) return;
        if (!Array.isArray(objects)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];
        let hasErrors = false;

        for (const object of objects) {
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

module.exports = list_of_objects;