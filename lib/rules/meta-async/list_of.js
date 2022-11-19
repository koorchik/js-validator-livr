const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function list_of(rules, ruleBuilders) {
    if (!Array.isArray(rules)) {
        rules = Array.prototype.slice.call(arguments);
        ruleBuilders = rules.pop();
    }

    const livr = { field: rules };
    const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

    return async (values, params, outputArr) => {
        if (util.isNoValue(values)) return;

        if (!Array.isArray(values)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];
        let hasErrors = false;

        for (const value of values) {
            try {
                const result = await validator.validate({ field: value });    
                results.push(result.field);
                errors.push(null);
            } catch (caughtErrors) {
                hasErrors = true;
                errors.push(caughtErrors.field);
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

module.exports = list_of;