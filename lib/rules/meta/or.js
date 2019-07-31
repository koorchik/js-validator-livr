const Validator = require('../../Validator');

function or() {
    const ruleSets = Array.prototype.slice.call(arguments);
    const ruleBuilders = ruleSets.pop();

    const validators = ruleSets.map(rules => {
        const livr = { field: rules };
        const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return validator;
    });

    return (value, params, outputArr) => {
        let lastError;

        for (const validator of validators) {
            const result = validator.validate({ field: value });

            if (result) {
                outputArr.push(result.field);
                return;
            } else {
                lastError = validator.getErrors().field;
            }
        }

        return lastError;
    };
}

module.exports = or;