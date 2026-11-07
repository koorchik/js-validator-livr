const util = require('../../util');

// ISO 13616: a country code, two check digits, 11-30 characters. No per-country length table.
// Checked as it is: no spaces are removed and lowercase letters fail
const IBAN_RE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;

// The first four characters moved to the end, letters replaced by two digits (A = 10 ... Z = 35):
// the number modulo 97 is 1. The remainder is computed a character at a time, so the number
// never exceeds 97 * 100 and needs no BigInt
function hasIbanChecksum(iban) {
  let remainder = 0;
  for (let i = 0; i < iban.length; i++) {
    const code = iban.charCodeAt((i + 4) % iban.length);
    remainder =
      code <= 57 // 0-9
        ? (remainder * 10 + (code - 48)) % 97
        : (remainder * 100 + (code - 55)) % 97;
  }
  return remainder === 1;
}

function iban() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [iban] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_IBAN');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!IBAN_RE.test(value) || !hasIbanChecksum(value)) return 'WRONG_IBAN';
    outputArr.push(value);
  };
}

module.exports = iban;
