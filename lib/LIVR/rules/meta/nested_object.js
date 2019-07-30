const Validator = require('../../Validator');
const util = require('../../util');

function nested_object(livr, ruleBuilders) {
    const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

    return (nestedObject, params, outputArr) => {
        if (util.isNoValue(nestedObject)) return;
        if (!util.isObject(nestedObject)) return 'FORMAT_ERROR';

        const result = validator.validate(nestedObject);

        if (result) {
            outputArr.push(result);
            return;
        } else {
            return validator.getErrors();
        }
    };
}

module.exports = nested_object;