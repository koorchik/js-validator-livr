const util = require('../../util');

function equal_to_field(field) {
    return (value, params) => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        if (value != params[field]) return 'FIELDS_NOT_EQUAL';
        return;
    };
}

module.exports = equal_to_field;