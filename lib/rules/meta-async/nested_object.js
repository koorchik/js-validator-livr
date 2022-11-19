const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function nested_object(livr, ruleBuilders) {
    const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

    return async (nestedObject, params, outputArr) => {
        if (util.isNoValue(nestedObject)) return;
        if (!util.isObject(nestedObject)) return 'FORMAT_ERROR';

        try {
            const result = await validator.validate(nestedObject);    
            outputArr.push(result);
            return;
        } catch (errors) {
            return errors;
        }
    };
}

module.exports = nested_object;