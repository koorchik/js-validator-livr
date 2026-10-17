const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

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
            let outcome = validator._validateOutcome({ field: value });
            if (util.isThenable(outcome)) outcome = await outcome;

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