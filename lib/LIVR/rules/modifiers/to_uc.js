const util = require('../../util');

function to_uc() {
    return (value, params, outputArr) => {
        if (util.isNoValue(value) || typeof value === 'object') return;

        value += ''; // TODO just skip numbers
        outputArr.push(value.toUpperCase());
    };
}

module.exports = to_uc;