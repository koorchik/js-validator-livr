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

    return (value, params, outputArr) => tryRuleSets(fieldRules, 0, value, outputArr);
}

// Tries the rule sets from #start until one passes. Returns the error of the last rule set,
// or a promise of it once some rule returns a promise.
function tryRuleSets(fieldRules, start, value, outputArr, lastError) {
    for (let i = start; i < fieldRules.length; i++) {
        let errCode;

        try {
            // On success fieldRule pushes the output value to outputArr itself;
            // a failed rule set pushes nothing
            errCode = fieldRules[i](value, { field: value }, outputArr);
        } catch (error) {
            // An exception of a rule is the error of the rule set, like in nested_object
            lastError = error;
            continue;
        }

        if (util.isThenable(errCode)) {
            return Promise.resolve(errCode).then(
                asyncErrCode => {
                    if (!asyncErrCode) return;
                    return tryRuleSets(fieldRules, i + 1, value, outputArr, asyncErrCode);
                },
                error => tryRuleSets(fieldRules, i + 1, value, outputArr, error)
            );
        }

        if (!errCode) return;
        lastError = errCode;
    }

    return lastError;
}

module.exports = or;
