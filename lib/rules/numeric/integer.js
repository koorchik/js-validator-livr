const util = require('../../util');

function integer() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!util.looksLikeNumber(value)) return 'NOT_INTEGER';

        const numValue = +value;
        if (!Number.isInteger(numValue)) return 'NOT_INTEGER';
        outputArr.push(numValue);
    };
}

module.exports = integer;