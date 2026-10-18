const util = require('../../util');

// Up to this length, indexOf() over the strings is as fast as a Map and much cheaper to prepare,
// which matters when a validator is created for every validation
const MAX_LIST_FOR_INDEX_OF = 16;

// A rest parameter instead of slicing `arguments`, which is slow
function one_of(...args) {
    let allowedValues = args[0];
    if (!Array.isArray(allowedValues)) {
        allowedValues = args;
        allowedValues.pop(); // pop ruleBuilders
    }

    // Allowed values are converted to strings once. The first occurrence wins, like in indexOf()
    if (allowedValues.length <= MAX_LIST_FOR_INDEX_OF) {
        const strAllowedValues = new Array(allowedValues.length);
        for (let i = 0; i < allowedValues.length; i++) {
            strAllowedValues[i] = String(allowedValues[i]);
        }

        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            const index = strAllowedValues.indexOf(String(value));
            if (index !== -1) {
                outputArr.push(allowedValues[index]);
                return;
            }

            return 'NOT_ALLOWED_VALUE';
        };
    }

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
