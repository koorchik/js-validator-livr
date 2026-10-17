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
            const errCode = validator._validateSingleField({ field: value }, 'field');

            if (errCode) {
                lastError = errCode;
            } else {
                outputArr.push(validator._singleFieldOutput);
                return;
            }
        }

        return lastError;
    };
}

module.exports = or;