const Validator = require('../../Validator');
const util = require('../../util');

function list_of(rules, ruleBuilders) {
    if (!Array.isArray(rules)) {
        rules = Array.prototype.slice.call(arguments);
        ruleBuilders = rules.pop();
    }

    const livr = { field: rules };
    const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

    return (values, params, outputArr) => {
        if (util.isNoValue(values)) return;

        if (!Array.isArray(values)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];
        let hasErrors = false;

        for (const value of values) {
            const errCode = validator._validateSingleField({ field: value }, 'field');

            if (errCode) {
                hasErrors = true;
                errors.push(errCode);
                results.push(null);
            } else {
                results.push(validator._singleFieldOutput);
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