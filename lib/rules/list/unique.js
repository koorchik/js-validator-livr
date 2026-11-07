const util = require('../../util');

const hasOwn = Object.prototype.hasOwnProperty;

// A rest parameter instead of slicing `arguments`, which is slow
//   unique(): primitive items, unique(...keys): objects with unique values of the keys
function unique(...keys) {
  keys.pop(); // pop ruleBuilders

  // A number is its string form: { unique: 0 } is the key "0"
  for (let i = 0; i < keys.length; i++) {
    if (typeof keys[i] === 'number' && isFinite(keys[i])) keys[i] = String(keys[i]);
    if (typeof keys[i] !== 'string') throw new Error('LIVR: "unique" takes key names as strings');
  }

  // Items are compared by their string forms, so 1 and "1" are duplicates.
  // A type error wins over duplicates, wherever it is in the list
  if (keys.length === 0) {
    return list => {
      if (util.isNoValue(list)) return;
      if (!Array.isArray(list)) return 'FORMAT_ERROR';

      const seen = new Set();
      let hasDuplicates = false;

      for (const item of list) {
        if (util.isNoValue(item)) continue;
        if (!util.isPrimitiveValue(item)) return 'FORMAT_ERROR';

        const strItem = String(item);
        if (seen.has(strItem)) hasDuplicates = true;
        else seen.add(strItem);
      }

      if (hasDuplicates) return 'NOT_UNIQUE_ITEMS';
    };
  }

  const lastKey = keys.length - 1;

  return list => {
    if (util.isNoValue(list)) return;
    if (!Array.isArray(list)) return 'FORMAT_ERROR';

    // Nested maps by the string forms of the key values, one level per key: no key strings to
    // build, and ["a,b"] and ["a", "b"] differ
    const seen = new Map();
    let hasDuplicates = false;

    for (const item of list) {
      if (util.isNoValue(item)) continue;
      if (!util.isObject(item)) return 'FORMAT_ERROR';

      // An item with an empty key value is not compared, a key value of a wrong type is an error
      let hasEmptyKeyValue = false;

      for (let i = 0; i <= lastKey; i++) {
        const keyValue = hasOwn.call(item, keys[i]) ? item[keys[i]] : undefined;

        if (util.isNoValue(keyValue)) {
          hasEmptyKeyValue = true;
        } else if (!util.isPrimitiveValue(keyValue)) {
          return 'FORMAT_ERROR';
        }
      }

      if (hasEmptyKeyValue) continue;

      let level = seen;
      for (let i = 0; i < lastKey; i++) {
        const strKeyValue = String(item[keys[i]]);
        let nextLevel = level.get(strKeyValue);

        if (nextLevel === undefined) {
          nextLevel = new Map();
          level.set(strKeyValue, nextLevel);
        }

        level = nextLevel;
      }

      const strKeyValue = String(item[keys[lastKey]]);
      if (level.has(strKeyValue)) hasDuplicates = true;
      else level.set(strKeyValue, true);
    }

    if (hasDuplicates) return 'NOT_UNIQUE_ITEMS';
  };
}

module.exports = unique;
