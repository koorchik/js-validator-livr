const util = require('../../util');

function one_of(allowedValues) {
    if (!Array.isArray(allowedValues)) {
        allowedValues = Array.prototype.slice.call(arguments);
        allowedValues.pop(); // pop ruleBuilders
    }

    // Pre-convert all allowed values once at factory time
    const strAllowedValues = allowedValues.map(v => String(v));

    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        const strValue = String(value);
        const index = strAllowedValues.indexOf(strValue);
        if (index !== -1) {
            outputArr.push(allowedValues[index]);
            return;
        }

        return 'NOT_ALLOWED_VALUE';
    };
}

module.exports = one_of;
