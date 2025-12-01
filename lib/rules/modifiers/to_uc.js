const util = require('../../util');

function to_uc() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value) || typeof value === 'object') return;

        const strValue = typeof value === 'string' ? value : String(value);
        outputArr.push(strValue.toUpperCase());
    };
}

module.exports = to_uc;