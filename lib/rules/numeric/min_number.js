const util = require('../../util');

function min_number(minNumber) {
    minNumber = +minNumber;

    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

        const numValue = +value;
        if (numValue < minNumber) return 'TOO_LOW';
        outputArr.push(numValue);
    };
}

module.exports = min_number;