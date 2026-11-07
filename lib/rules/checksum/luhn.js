const util = require('../../util');

const DIGITS_RE = /^[0-9]{2,}$/;

// Luhn mod 10: every second digit from the right is doubled (minus 9 when above 9)
function hasLuhnChecksum(digits) {
  let sum = 0;
  let isDoubled = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - 48;
    if (isDoubled) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isDoubled = !isDoubled;
  }
  return sum % 10 === 0;
}

function luhn() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [luhn] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_CHECKSUM');
      value = String(value);
    } else if (value === '') {
      return;
    }

    // Checked as it is: no spaces or dashes are removed
    if (!DIGITS_RE.test(value) || !hasLuhnChecksum(value)) return 'WRONG_CHECKSUM';
    outputArr.push(value);
  };
}

module.exports = luhn;
