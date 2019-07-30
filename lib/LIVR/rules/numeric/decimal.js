const util = require('../../util');

function decimal() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_DECIMAL';

        value += '';
        if (!/^(?:\-?(?:(?:[0-9]+\.[0-9]+)|(?:[0-9]+)))$/.test(value)) return 'NOT_DECIMAL';
        outputArr.push(+value);
    };
}

module.exports = decimal;