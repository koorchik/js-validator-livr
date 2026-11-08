const util = require('../../util');

// Letters of host labels: Latin letters and U+00A1-U+FFFF, so Unicode hosts (пример.рф) pass
const LETTER = 'a-z\\u00a1-\\uffff';

// 1-63 characters, not starting or ending with "-". "." is not in a label, so labels do not
// backtrack into each other and a host is checked in linear time
const LABEL = `[${LETTER}0-9](?:[${LETTER}0-9-]{0,61}[${LETTER}0-9])?`;

// The first byte is 1-223, the last one is not 255
const IPV4 =
  '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
  '\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4])';

// 0-65535 in 1-5 digits
const PORT = '(?:[0-9]{1,4}|[0-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])';

// Optional user info, then an IPv4 address, labels with a top-level domain of 2-63 letters or
// localhost, no dot after the host. Pre-compiled at module load time (not per call)
const URL_RE = new RegExp(
  `^https?://(?:\\S+@)?(?:${IPV4}|(?:${LABEL}\\.)+[${LETTER}]{2,63}|localhost)` +
    `(?::${PORT})?(?:[/?#]\\S*)?$`,
  'i'
);

function url() {
  return value => {
    if (util.isNoValue(value)) return;
    if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

    if (value.length < 2083 && URL_RE.test(value)) return;
    return 'WRONG_URL';
  };
}

module.exports = url;
