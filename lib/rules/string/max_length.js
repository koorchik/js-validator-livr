const util = require('../../util');
 
function max_length(maxLength) {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        value += '';
        if (value.length > maxLength) return 'TOO_LONG';
        outputArr.push(value);
    };
}

module.exports = max_length;