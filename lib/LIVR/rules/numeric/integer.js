const util = require('../../util');

function integer() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_INTEGER';

        if (!Number.isInteger(+value)) return 'NOT_INTEGER';
        outputArr.push(+value);
    };
}

module.exports = integer;