const util = require('../../util');

const DECIMAL_RE = /^-?(?:(?:[0-9]+\.[0-9]+)|(?:[0-9]+))$/;

function decimal() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_DECIMAL';

        if (!DECIMAL_RE.test(value + '')) return 'NOT_DECIMAL';
        outputArr.push(+value);
    };
}

module.exports = decimal;