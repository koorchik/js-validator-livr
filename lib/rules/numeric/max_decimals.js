// Digits after the decimal point of a string in the grammar of the "decimal" rule,
// -?[0-9]+(\.[0-9]+)?, without the trailing zeros: "1.230" has 2, "5.000" has 0. -1 when the
// string is not such a number. Counted as written, so "0.10000000000000000001" has 20 although it
// is not exact as a double. One pass over the character codes, no regular expression
function countDecimals(str) {
  const length = str.length;
  let i = str.charCodeAt(0) === 45 ? 1 : 0; // "-"

  const integerStart = i;
  for (; i < length; i++) {
    const code = str.charCodeAt(i);
    if (code < 48 || code > 57) break;
  }
  if (i === integerStart) return -1;
  if (i === length) return 0;
  if (str.charCodeAt(i) !== 46) return -1; // "."

  const fractionStart = i + 1;
  if (fractionStart === length) return -1; // "1."

  // The end of the last digit that is not "0"
  let significantEnd = fractionStart;
  for (i = fractionStart; i < length; i++) {
    const code = str.charCodeAt(i);
    if (code < 48 || code > 57) return -1;
    if (code !== 48) significantEnd = i + 1;
  }

  return significantEnd - fractionStart;
}

// Decimals of String() of a number that is not an integer: "0.125", "-12.25" or the exponent form
// of small numbers, "1e-7", "1.5e-7". String() has no trailing zeros
function countNumberDecimals(str) {
  const dotIndex = str.indexOf('.');
  const exponentIndex = str.indexOf('e');
  const fractionEnd = exponentIndex === -1 ? str.length : exponentIndex;
  const fractionLength = dotIndex === -1 ? 0 : fractionEnd - dotIndex - 1;
  if (exponentIndex === -1) return fractionLength;

  // "e-7" or "e+21"
  let exponent = 0;
  for (let i = exponentIndex + 2; i < str.length; i++) {
    exponent = exponent * 10 + (str.charCodeAt(i) - 48);
  }
  if (str.charCodeAt(exponentIndex + 1) === 45) exponent = -exponent; // "-"
  return Math.max(0, fractionLength - exponent);
}

// A number in an argument may be a string too: "2" is 2. Arguments after it are ignored
function max_decimals(maxDecimalsArg) {
  // A new variable, not the parameter: assigning a parameter of a function that reads `arguments`
  // makes building the rule slower
  const maxDecimals =
    typeof maxDecimalsArg === 'string' && countDecimals(maxDecimalsArg) >= 0
      ? +maxDecimalsArg
      : maxDecimalsArg;

  // Without arguments the rule gets only ruleBuilders
  if (arguments.length === 1 || !Number.isInteger(maxDecimals) || maxDecimals < 0) {
    throw new Error('LIVR: "max_decimals" takes a non-negative integer');
  }

  return (value, params, outputArr) => {
    let decimals;
    let number;

    if (typeof value === 'string') {
      if (value === '') return;
      decimals = countDecimals(value);
      if (decimals < 0) return 'NOT_NUMBER';
      // A string beyond the doubles ("1" and 400 zeros) is not a number either: the output is a
      // number, and JSON has no infinity
      number = +value;
      if (!isFinite(number)) return 'NOT_NUMBER';
    } else if (typeof value === 'number') {
      if (!isFinite(value)) return 'NOT_NUMBER';
      number = value;
      // In the string form, so 1.230 has 2 decimals, 1e-7 has 7
      decimals = Number.isInteger(value) ? 0 : countNumberDecimals(String(value));
    } else if (value === undefined || value === null) {
      return;
    } else {
      return typeof value === 'boolean' ? 'NOT_NUMBER' : 'FORMAT_ERROR';
    }

    if (decimals > maxDecimals) return 'TOO_MANY_DECIMALS';
    outputArr.push(number);
  };
}

module.exports = max_decimals;
