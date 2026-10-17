const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function or() {
    const ruleSets = Array.prototype.slice.call(arguments);
    const ruleBuilders = ruleSets.pop();

    const fieldRules = ruleSets.map(rules => {
        const livr = { field: rules };
        const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

        return validator.getFieldRule('field');
    });

    return async (value, params, outputArr) => {
        let lastError;

        for (const fieldRule of fieldRules) {
            try {
                // Pushes the output only when all rules of the set pass
                let errCode = fieldRule(value, { field: value }, outputArr);
                if (util.isThenable(errCode)) errCode = await errCode;
                if (!errCode) return;

                lastError = errCode;
            } catch (errors) {
                // Exceptions of rules were rejections of validate({ field: value })
                lastError = errors.field;
            }
        }

        return lastError;
    };
}

module.exports = or;