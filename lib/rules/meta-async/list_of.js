const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function list_of(rules, ruleBuilders) {
    if (!Array.isArray(rules)) {
        rules = Array.prototype.slice.call(arguments);
        ruleBuilders = rules.pop();
    }

    const livr = { field: rules };
    const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();
    const validateItem = validator.getFieldRule('field');

    return async (values, params, outputArr) => {
        if (util.isNoValue(values)) return;

        if (!Array.isArray(values)) return 'FORMAT_ERROR';

        const results = [];
        const errors = [];
        let hasErrors = false;

        for (const value of values) {
            // Rules of an item see it as the only field of the data, like in validate().
            // The output of a valid item is pushed to results
            let errCode;
            let isFailed;

            try {
                errCode = validateItem(value, { field: value }, results);
                if (util.isThenable(errCode)) errCode = await errCode;
                isFailed = !!errCode;
            } catch (caughtErrors) {
                // Exceptions of rules were rejections of validate({ field: value })
                errCode = caughtErrors.field;
                isFailed = true;
            }

            if (isFailed) {
                hasErrors = true;
                errors.push(errCode);
                results.push(null);
            } else {
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