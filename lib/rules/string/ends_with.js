const util = require('../../util');

// A rest parameter instead of slicing `arguments`, which is slow
function ends_with(...strings) {
  strings.pop(); // pop ruleBuilders

  // A number is its string form: { ends_with: 1 } is "1"
  for (let i = 0; i < strings.length; i++) {
    if (typeof strings[i] === 'number' && isFinite(strings[i])) strings[i] = String(strings[i]);
  }

  if (strings.length === 0 || strings.some(str => typeof str !== 'string' || str === '')) {
    throw new Error('LIVR: "ends_with" takes one or more non-empty strings');
  }

  return (value, params, outputArr) => {
    if (util.isNoValue(value)) return;
    if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

    // The string form must end with one of the strings, case-sensitive
    const strValue = typeof value === 'string' ? value : String(value);
    for (let i = 0; i < strings.length; i++) {
      if (strValue.endsWith(strings[i])) {
        outputArr.push(strValue);
        return;
      }
    }

    return 'WRONG_FORMAT';
  };
}

module.exports = ends_with;
