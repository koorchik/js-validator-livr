const util = require('../../util');

function trim() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value) || typeof value === 'object') return;

        const strValue = typeof value === 'string' ? value : String(value);
        outputArr.push(strValue.trim());
    };
}

module.exports = trim;