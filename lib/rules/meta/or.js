const Validator = require('../../Validator');

function or() {
    const ruleSets = Array.prototype.slice.call(arguments);
    const ruleBuilders = ruleSets.pop();

    const fieldRules = ruleSets.map(rules => {
        const livr = { field: rules };
        const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return validator.getFieldRule('field');
    });

    return (value, params, outputArr) => {
        let lastError;

        for (const fieldRule of fieldRules) {
            // Pushes the output only when all rules of the set pass
            const errCode = fieldRule(value, { field: value }, outputArr);
            if (!errCode) return;

            lastError = errCode;
        }

        return lastError;
    };
}

module.exports = or;