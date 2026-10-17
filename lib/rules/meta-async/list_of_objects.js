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
            let outcome = validator._validateOutcome(object);
            if (util.isThenable(outcome)) outcome = await outcome;

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

module.exports = list_of_objects;