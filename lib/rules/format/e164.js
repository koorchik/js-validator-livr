const util = require('../../util');

// "+", then 7-15 digits, the first is not 0
const E164_RE = /^\+[1-9][0-9]{6,14}$/;

function e164() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [e164] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_E164');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!E164_RE.test(value)) return 'WRONG_E164';
    outputArr.push(value);
  };
}

module.exports = e164;
