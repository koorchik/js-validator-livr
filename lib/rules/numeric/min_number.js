const util = require('../../util');

function min_number(minNumber) {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

        if (+value < +minNumber) return 'TOO_LOW';
        outputArr.push(+value);
    };
}

module.exports = min_number;