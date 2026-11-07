const util = require('../../util');

const HEX_RE = /^[0-9a-fA-F]+$/;

// Hex lengths of the digests. A Map: arguments like "constructor" are not algorithms
const HEX_LENGTH_BY_ALGORITHM = new Map([
  ['md5', 32],
  ['sha1', 40],
  ['sha256', 64],
  ['sha384', 96],
  ['sha512', 128],
]);

// A rest parameter instead of slicing `arguments`, which is slow
function digest(...algorithms) {
  algorithms.pop(); // pop ruleBuilders

  if (algorithms.length === 0) {
    throw new Error('LIVR: rule [digest] needs one or more algorithms');
  }

  const lengths = new Array(algorithms.length);
  for (let i = 0; i < algorithms.length; i++) {
    lengths[i] = HEX_LENGTH_BY_ALGORITHM.get(algorithms[i]);
    if (lengths[i] === undefined) {
      throw new Error(
        `LIVR: rule [digest] got an unknown algorithm ${JSON.stringify(algorithms[i])}`
      );
    }
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_DIGEST');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (lengths.indexOf(value.length) === -1 || !HEX_RE.test(value)) return 'WRONG_DIGEST';
    outputArr.push(value);
  };
}

module.exports = digest;
