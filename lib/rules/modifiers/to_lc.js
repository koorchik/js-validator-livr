const util = require('../../util');

function to_lc() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value) || typeof value === 'object') return;

        value += ''; // TODO just skip numbers
        outputArr.push(value.toLowerCase());
    };
}

module.exports = to_lc;