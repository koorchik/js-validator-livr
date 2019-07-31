const Validator = require('../../Validator');
const util = require('../../util');

function variable_object(selectorField, livrs, ruleBuilders) {
    const validators = {};

    for (const selectorValue in livrs) {
        const validator = new Validator(livrs[selectorValue])
            .registerRules(ruleBuilders)
            .prepare();
        validators[selectorValue] = validator;
    }

    return (object, params, outputArr) => {
        if (util.isNoValue(object)) return;

        if (
            !util.isObject(object) ||
            !object[selectorField] ||
            !validators[object[selectorField]]
        ) {
            return 'FORMAT_ERROR';
        }

        const validator = validators[object[selectorField]];
        const result = validator.validate(object);

        if (result) {
            outputArr.push(result);
            return;
        } else {
            return validator.getErrors();
        }
    };
}

module.exports = variable_object;
