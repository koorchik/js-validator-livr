const util = require('../../util');

function remove(chars) {
    const escapedChars = util.escapeRegExp(chars);
    const re = new RegExp(`[${escapedChars}]`, 'g');

    return (value, params, outputArr) => {
        if (util.isNoValue(value) || typeof value === 'object') return;

        const strValue = typeof value === 'string' ? value : String(value);
        outputArr.push(strValue.replace(re, ''));
    };
}

module.exports = remove;