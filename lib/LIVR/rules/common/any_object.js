const util = require('../../util');

function any_object() {
    return value => {
        if (util.isNoValue(value)) return;

        if (!util.isObject(value)) {
            return 'FORMAT_ERROR';
        }
    };
};

module.exports = any_object;