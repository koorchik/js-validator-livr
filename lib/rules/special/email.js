const util = require('../../util');

// One "@" only, and no "_" in the domain: a quoted local part cannot contain "@", the domain
// cannot contain "_" or "@". Non-capturing groups, as test() needs no captures.
const EMAIL_RE = /^(?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*|"[^@\n\r\u2028\u2029]+")@(?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\]|(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})$/;

function email() {
    return value => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
        if (!EMAIL_RE.test(value + '')) return 'WRONG_EMAIL';

        return;
    };
}

module.exports = email;
