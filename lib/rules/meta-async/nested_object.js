const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function nested_object(livr, ruleBuilders) {
    const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

    return async (nestedObject, params, outputArr) => {
        if (util.isNoValue(nestedObject)) return;
        if (!util.isObject(nestedObject)) return 'FORMAT_ERROR';

        let outcome;
        try {
            outcome = validator._validateMaybeSync(nestedObject);
            if (outcome instanceof Promise) outcome = await outcome;
        } catch (errors) {
            outcome = { errors };
        }

        if (!outcome.result) return outcome.errors;

        outputArr.push(outcome.result);
        return;
    };
}

module.exports = nested_object;