const util = require('../../util');

function length_equal(length) {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        value += '';
        if (value.length < length) return 'TOO_SHORT';
        if (value.length > length) return 'TOO_LONG';
        outputArr.push(value);
    };
}

module.exports = length_equal;