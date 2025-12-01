const util = require('../../util');

function to_lc() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value) || typeof value === 'object') return;

        const strValue = typeof value === 'string' ? value : String(value);
        outputArr.push(strValue.toLowerCase());
    };
}

module.exports = to_lc;
