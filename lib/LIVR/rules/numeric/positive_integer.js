const util = require('../../util');

function positive_integer() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_INTEGER';

        if (!Number.isInteger(+value) || +value < 1) return 'NOT_POSITIVE_INTEGER';
        outputArr.push(+value);
    };
}

module.exports = positive_integer;