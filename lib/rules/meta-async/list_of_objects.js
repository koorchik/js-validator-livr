const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function list_of_objects(livr, ruleBuilders) {
    const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

    return async (objects, params, outputArr) => {
        if (util.isNoValue(objects)) return;
        if (!Array.isArray(objects)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];
        let hasErrors = false;

        for (const object of objects) {
            try {
                const result = await validator.validate(object);
                results.push(result);
                errors.push(null);
            } catch (caughtErrors) {
                hasErrors = true;
                errors.push(caughtErrors);
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