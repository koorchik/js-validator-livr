const util = require('../../util');

const hasOwn = Object.prototype.hasOwnProperty;

// A length: a non-negative integer, also as a string ("3"). -1 for any other value
function toLength(value) {
  if (typeof value === 'string' && /^[0-9]+(?:\.[0-9]+)?$/.test(value)) value = +value;
  return Number.isInteger(value) && value >= 0 ? value : -1;
}

// A rest parameter instead of slicing `arguments`, which is slow
//   list_length(length), list_length(min, max), list_length({ min, max }).
// Two or more arguments are min and max, the arguments after them and after the object are ignored
function list_length(...args) {
  args.pop(); // pop ruleBuilders

  let min = 0;
  let max = Infinity;

  if (typeof args[0] === 'object' && util.isObject(args[0])) {
    const options = args[0];

    for (const key in options) {
      if (key !== 'min' && key !== 'max') {
        throw new Error(`LIVR: "list_length" got an unknown option "${key}"`);
      }
    }

    if (hasOwn.call(options, 'min')) min = toLength(options.min);
    if (hasOwn.call(options, 'max')) max = toLength(options.max);

    if (util.isEmptyObject(options) || min < 0 || max < 0) {
      throw new Error('LIVR: "list_length" takes non-negative integers as "min" and "max"');
    }
  } else {
    min = args.length === 0 ? -1 : toLength(args[0]);
    max = args.length === 1 ? min : toLength(args[1]);

    if (min < 0 || max < 0) {
      throw new Error(
        'LIVR: "list_length" takes a length, min and max, or an object with "min" and "max"'
      );
    }
  }

  if (min > max) throw new Error('LIVR: "list_length" got "min" greater than "max"');

  return list => {
    // An empty list is a value: { min: 1 } rejects it
    if (util.isNoValue(list)) return;
    if (!Array.isArray(list)) return 'FORMAT_ERROR';

    if (list.length < min) return 'TOO_FEW_ITEMS';
    if (list.length > max) return 'TOO_MANY_ITEMS';
  };
}

module.exports = list_length;
