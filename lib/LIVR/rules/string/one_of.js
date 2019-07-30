const util = require('../../util');

function one_of(allowedValues) {
    if (!Array.isArray(allowedValues)) {
        allowedValues = Array.prototype.slice.call(arguments);
        allowedValues.pop(); // pop ruleBuilders
    }

    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;

        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        for (const allowedValue of allowedValues) {
            if (value + '' === allowedValue + '') {
                outputArr.push(allowedValue);
                return;
            }
        }

        return 'NOT_ALLOWED_VALUE';
    };
}

module.exports = one_of;