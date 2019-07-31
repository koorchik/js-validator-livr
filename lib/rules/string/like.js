const util = require('../../util');

function like(reStr, flags) {
    const isIgnoreCase = arguments.length === 3 && flags.match('i');
    const re = new RegExp(reStr, isIgnoreCase ? 'i' : '');

    return (value, params, outputArr) => {
        if (util.isNoValue(value)) return;

        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        value += '';
        if (!value.match(re)) return 'WRONG_FORMAT';
        outputArr.push(value);
    };
}

module.exports = like;