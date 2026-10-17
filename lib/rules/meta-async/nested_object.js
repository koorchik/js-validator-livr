const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function nested_object(livr, ruleBuilders) {
    const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

    return async (nestedObject, params, outputArr) => {
        if (util.isNoValue(nestedObject)) return;
        if (!util.isObject(nestedObject)) return 'FORMAT_ERROR';

        let outcome = validator._validateOutcome(nestedObject);
        if (util.isThenable(outcome)) outcome = await outcome;

        if (!outcome.result) return outcome.errors;

        outputArr.push(outcome.result);
        return;
    };
}

module.exports = nested_object;