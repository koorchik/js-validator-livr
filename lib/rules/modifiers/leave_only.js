const util = require('../../util');

function leave_only(chars) {
    chars = util.escapeRegExp(chars);
    const re = new RegExp('[^' + chars + ']', 'g');

    return (value, params, outputArr) => {
        if (util.isNoValue(value) || typeof value === 'object') return;

        value += ''; // TODO just skip numbers
        outputArr.push(value.replace(re, ''));
    };
}

module.exports = leave_only;