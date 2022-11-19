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

        try {
            const result = await validator.validate(object);    
            outputArr.push(result);
            return;
        } catch (errors) {
            return errors;
        }
    };
}

module.exports = variable_object;
