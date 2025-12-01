const util = require('../../util');

function eq(allowedValue) {
    const strAllowedValue = String(allowedValue);

    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        if (String(value) === strAllowedValue) {
            outputArr.push(allowedValue);
            return;
        }

        return 'NOT_ALLOWED_VALUE';
    };
}

module.exports = eq;
