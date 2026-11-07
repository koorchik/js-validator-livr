const util = require('../../util');

function digits() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: "digits" takes no arguments');
  }
  return checkDigits;
}

// Only ASCII digits, a loop over the character codes: faster than a regular expression
function isDigits(str) {
  const length = str.length;
  for (let i = 0; i < length; i++) {
    const code = str.charCodeAt(i);
    if (code < 48 || code > 57) return false;
  }
  return true;
}

// The output is a string, with the leading zeros: "007" stays "007", 7 becomes "7"
function checkDigits(value, params, outputArr) {
  if (typeof value === 'string') {
    // A string is the output as it is
    if (value !== '' && !isDigits(value)) return 'NOT_DIGITS';
    return;
  }

  // A non-negative integer below 10^21 is written without an exponent: only digits
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 1e21) {
    outputArr.push(String(value));
    return;
  }

  if (value === undefined || value === null) return;

  // The string form of a boolean, a negative, fractional or larger number has other characters
  return util.isPrimitiveValue(value) ? 'NOT_DIGITS' : 'FORMAT_ERROR';
}

module.exports = digits;
