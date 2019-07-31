const util = require('../../util');

function positive_decimal() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_DECIMAL';

        value += '';
        if (!/^(?:(?:[0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value))
            return 'NOT_POSITIVE_DECIMAL';
        outputArr.push(+value);
    };
}

module.exports = positive_decimal;
