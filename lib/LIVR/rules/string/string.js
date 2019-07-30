const util = require('../../util');

function string() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        outputArr.push(value + '');
        return;
    };
}

module.exports = string;