const util = require('../../util');

// A rest parameter instead of slicing `arguments`, which is slow
function not_one_of(...args) {
  args.pop(); // pop ruleBuilders

  if (args.length === 0) throw new Error('LIVR: "not_one_of" takes one or more values');

  // Forbidden values as strings, so that 1 matches "1" and true matches "true"
  const forbiddenValues = new Set();
  for (const arg of args) {
    if (!util.isPrimitiveValue(arg)) {
      throw new Error('LIVR: "not_one_of" takes strings, numbers or booleans');
    }

    forbiddenValues.add(String(arg));
  }

  return value => {
    if (util.isNoValue(value)) return;
    if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

    if (forbiddenValues.has(String(value))) return 'NOT_ALLOWED_VALUE';
  };
}

module.exports = not_one_of;
