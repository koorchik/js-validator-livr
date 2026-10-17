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
            let outcome;
            try {
                outcome = validator._validateMaybeSync({ field: value });
                if (outcome instanceof Promise) outcome = await outcome;
            } catch (caughtErrors) {
                outcome = { errors: caughtErrors };
            }

            if (!outcome.result) {
                hasErrors = true;
                errors.push(outcome.errors.field);
                results.push(null);
            } else {
                results.push(outcome.result.field);
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

module.exports = list_of;