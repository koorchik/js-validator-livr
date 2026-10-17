const AsyncValidator = require('../../AsyncValidator');

function or() {
    const ruleSets = Array.prototype.slice.call(arguments);
    const ruleBuilders = ruleSets.pop();

    const validators = ruleSets.map(rules => {
        const livr = { field: rules };
        const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

        return validator;
    });

    return async (value, params, outputArr) => {
        let lastError;

        for (const validator of validators) {
            let outcome;
            try {
                outcome = validator._validateMaybeSync({ field: value });
                if (outcome instanceof Promise) outcome = await outcome;
            } catch (errors) {
                outcome = { errors };
            }

            if (!outcome.result) {
                lastError = outcome.errors.field;
            } else {
                outputArr.push(outcome.result.field);
                return;
            }
        }

        return lastError;
    };
}

module.exports = or;