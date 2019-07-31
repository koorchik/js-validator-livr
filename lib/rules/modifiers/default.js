const util = require('../../util');

module.exports = defaultValue => {
    return (value, params, outputArr) => {
        if (util.isNoValue(value)) {
            outputArr.push(defaultValue);
        }
    };
}


