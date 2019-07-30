const util = require('../../util');

function number_between(minNumber, maxNumber) {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

        if (+value < +minNumber) return 'TOO_LOW';
        if (+value > +maxNumber) return 'TOO_HIGH';
        outputArr.push(+value);
    };
}

module.exports = number_between;