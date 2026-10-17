const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');
const { buildSelectorValidators, findSelectorValidator } = require('../meta/selectorValidators');

function variable_object(selectorField, livrs, ruleBuilders) {
    const validators = buildSelectorValidators(AsyncValidator, livrs, ruleBuilders);

    return async (object, params, outputArr) => {
        if (util.isNoValue(object)) return;

        const validator = findSelectorValidator(validators, object, selectorField);
        if (!validator) return 'FORMAT_ERROR';

        let outcome = validator._validateOutcome(object);
        if (util.isThenable(outcome)) outcome = await outcome;

        if (!outcome.result) return outcome.errors;

        outputArr.push(outcome.result);
        return;
    };
}

module.exports = variable_object;
