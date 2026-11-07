const util = require('../../util');

// No "0x" prefix
const HEX_RE = /^[0-9a-fA-F]+$/;

function hex() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [hex] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_HEX');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!HEX_RE.test(value)) return 'WRONG_HEX';
    outputArr.push(value);
  };
}

module.exports = hex;
