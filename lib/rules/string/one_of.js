const util = require('../../util');

function one_of(allowedValues) {
    if (!Array.isArray(allowedValues)) {
        allowedValues = Array.prototype.slice.call(arguments);
        allowedValues.pop(); // pop ruleBuilders
    }

    // Pre-convert all allowed values once at factory time (first occurrence wins, like indexOf)
    const indexByStrValue = new Map();
    for (let i = 0; i < allowedValues.length; i++) {
        const strAllowedValue = String(allowedValues[i]);
        if (!indexByStrValue.has(strAllowedValue)) indexByStrValue.set(strAllowedValue, i);
    }

    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        const index = indexByStrValue.get(String(value));
        if (index !== undefined) {
            outputArr.push(allowedValues[index]);
            return;
        }

        return 'NOT_ALLOWED_VALUE';
    };
}

module.exports = one_of;
