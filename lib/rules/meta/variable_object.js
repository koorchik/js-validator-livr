const Validator = require('../../Validator');
const util = require('../../util');
const { buildSelectorValidators, findSelectorValidator } = require('./selectorValidators');

function variable_object(selectorField, livrs, ruleBuilders) {
    const validators = buildSelectorValidators(Validator, livrs, ruleBuilders);

    return (object, params, outputArr) => {
        if (util.isNoValue(object)) return;

        const validator = findSelectorValidator(validators, object, selectorField);
        if (!validator) return 'FORMAT_ERROR';

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
