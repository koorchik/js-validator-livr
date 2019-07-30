const util = require('../../util');

function trim() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value) || typeof value === 'object') return;

        value += ''; // TODO just do not trim numbers
        outputArr.push(value.replace(/^\s*/, '').replace(/\s*$/, ''));
    };
}

module.exports = trim;