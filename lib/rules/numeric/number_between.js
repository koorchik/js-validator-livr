const util = require('../../util');

function number_between(minNumber, maxNumber) {
    minNumber = +minNumber;
    maxNumber = +maxNumber;

    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

        const numValue = +value;
        if (numValue < minNumber) return 'TOO_LOW';
        if (numValue > maxNumber) return 'TOO_HIGH';
        outputArr.push(numValue);
    };
}

module.exports = number_between;