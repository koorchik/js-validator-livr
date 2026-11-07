// A number as the separator is its string form: { split: 1 } splits at "1". Arguments after the
// separator are ignored
function split(separatorArg) {
  // A new variable, not the parameter: assigning a parameter of a function that reads `arguments`
  // makes building the rule slower
  const separator =
    typeof separatorArg === 'number' && isFinite(separatorArg)
      ? String(separatorArg)
      : separatorArg;

  // Without arguments the rule gets only ruleBuilders
  if (arguments.length === 1 || typeof separator !== 'string' || separator === '') {
    throw new Error('LIVR: "split" takes a non-empty separator string');
  }

  // A modifier: lists, empty values and objects stay as they are, the next rule reports them
  return (value, params, outputArr) => {
    if (typeof value === 'string') {
      // At every separator, empty parts are kept: "a,,b" -> ["a", "", "b"]
      if (value !== '') outputArr.push(value.split(separator));
    } else if ((typeof value === 'number' && isFinite(value)) || typeof value === 'boolean') {
      // The string form, like a string: 5 -> ["5"], 1.5 with "." -> ["1", "5"], true -> ["true"]
      outputArr.push(String(value).split(separator));
    }
  };
}

module.exports = split;
