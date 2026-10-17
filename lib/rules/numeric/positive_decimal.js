const util = require('../../util');

function positive_decimal() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_DECIMAL';

        const numValue = +value;
        if (Number.isNaN(numValue) || numValue <= 0) return 'NOT_POSITIVE_DECIMAL';
        outputArr.push(numValue);
    };
}

module.exports = positive_decimal;
