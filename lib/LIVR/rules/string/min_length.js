const util = require('../../util');

function min_length(minLength) {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        value += '';
        if (value.length < minLength) return 'TOO_SHORT';
        outputArr.push(value);
    };
}

module.exports = min_length;