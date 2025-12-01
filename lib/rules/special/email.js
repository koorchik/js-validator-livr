const util = require('../../util');

const EMAIL_RE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const UNDERSCORE_AFTER_AT = /@.*_/;
const DOUBLE_AT = /@.*@/;

function email() {
    return value => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        const strValue = value + '';
        if (UNDERSCORE_AFTER_AT.test(strValue)) return 'WRONG_EMAIL';
        if (DOUBLE_AT.test(strValue)) return 'WRONG_EMAIL';
        if (!EMAIL_RE.test(strValue)) return 'WRONG_EMAIL';

        return;
    };
}

module.exports = email;