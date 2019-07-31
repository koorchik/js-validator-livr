const util = require('../../util');

function required() {
    return value => {
        if (util.isNoValue(value)) {
            return 'REQUIRED';
        }

        return;
    };
};

module.exports = required;