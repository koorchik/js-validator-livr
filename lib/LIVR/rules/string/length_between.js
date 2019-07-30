const util = require('../../util');

function length_between(minLength, maxLength) {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        value += '';
        if (value.length < minLength) return 'TOO_SHORT';
        if (value.length > maxLength) return 'TOO_LONG';
        outputArr.push(value);
    };
}

module.exports = length_between;