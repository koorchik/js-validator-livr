// Any value passes, including objects, lists and empty values, and stays unchanged in the
// output. Unlike a field without rules, the value is kept
function any() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [any] takes no arguments');
  }

  return () => {};
}

module.exports = any;
