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
            try {
                const result = await validator.validate({ field: value });    
                outputArr.push(result.field);
                return;
            } catch (errors) {
                lastError = errors.field;
            }
        }

        return lastError;
    };
}

module.exports = or;