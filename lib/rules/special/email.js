const util = require('../../util');
const emailRe = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function email() {
    return value => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        value += '';
        if (/\@.*_/.test(value)) return 'WRONG_EMAIL';
        if (/\@.*\@/.test(value)) return 'WRONG_EMAIL';
        if (!emailRe.test(value)) return 'WRONG_EMAIL';

        return;
    };
}

module.exports = email;