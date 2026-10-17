const util = require('../../util');

const EMAIL_RE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function email() {
    return value => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        const strValue = value + '';

        // No "_" after "@" and no second "@". Same outcome as the former /@.*_/ and /@.*@/
        // checks: the only extra matches contain a line break, which EMAIL_RE rejects anyway.
        const atIndex = strValue.indexOf('@');
        if (atIndex === -1) return 'WRONG_EMAIL';
        if (strValue.indexOf('_', atIndex) !== -1) return 'WRONG_EMAIL';
        if (strValue.indexOf('@', atIndex + 1) !== -1) return 'WRONG_EMAIL';
        if (!EMAIL_RE.test(strValue)) return 'WRONG_EMAIL';

        return;
    };
}

module.exports = email;