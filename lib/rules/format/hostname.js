const util = require('../../util');

// RFC 1123 labels of 1-63 characters, not starting or ending with "-", no trailing dot.
// A single label passes. "." is not in a label, so labels do not backtrack into each other
const HOSTNAME_RE =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const MAX_LENGTH = 253;

// Labels may be all digits, except the last one (RFC 1123, section 2.1): "192.0.2.1" and "123"
// are not hostnames. A scan from the end that stops at the first character that is not a digit,
// usually the last one: cheaper than a lookahead in HOSTNAME_RE or a second pass
function hasNonDigitInLastLabel(str) {
  for (let i = str.length - 1; i >= 0; i--) {
    const code = str.charCodeAt(i);
    if (code === 46) return false; // "."
    if (code < 48 || code > 57) return true;
  }
  return false;
}

function hostname() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [hostname] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_HOSTNAME');
      value = String(value);
    } else if (value === '') {
      return;
    }

    // After HOSTNAME_RE the last character is a letter or a digit: a letter ends the check
    const isValid =
      value.length <= MAX_LENGTH &&
      HOSTNAME_RE.test(value) &&
      (value.charCodeAt(value.length - 1) > 57 || hasNonDigitInLastLabel(value));
    if (!isValid) return 'WRONG_HOSTNAME';
    outputArr.push(value);
  };
}

module.exports = hostname;
