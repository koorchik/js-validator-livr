const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function variable_object(selectorField, livrs, ruleBuilders) {
    const validators = {};

    for (const selectorValue in livrs) {
        const validator = new AsyncValidator(livrs[selectorValue])
            .registerRules(ruleBuilders)
            .prepare();
        validators[selectorValue] = validator;
    }

    return async (object, params, outputArr) => {
        if (util.isNoValue(object)) return;

        if (
            !util.isObject(object) ||
            !object[selectorField] ||
            !validators[object[selectorField]]
        ) {
            return 'FORMAT_ERROR';
        }

        const validator = validators[object[selectorField]];

        let outcome;
        try {
            outcome = validator._validateMaybeSync(object);
            if (outcome instanceof Promise) outcome = await outcome;
        } catch (errors) {
            outcome = { errors };
        }

        if (!outcome.result) return outcome.errors;

        outputArr.push(outcome.result);
        return;
    };
}

module.exports = variable_object;
