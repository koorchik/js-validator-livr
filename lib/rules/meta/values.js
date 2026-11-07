const Validator = require('../../Validator');
const util = require('../../util');

// Values have no containing object: a reference in their rules (required_if, when) is a missing
// value. Frozen, so that no rule can add fields to it
const NO_FIELDS = Object.freeze({});

// A rest parameter instead of slicing `arguments`, which is slow.
// The arguments are the same as in list_of: values('string'), values('required', 'string')
// or values(['required', 'string'])
function values(...args) {
  // ruleBuilders is the last argument. With a list of rules, the arguments after it are ignored
  const ruleBuilders = args.pop();
  const rules = Array.isArray(args[0]) ? args[0] : args;

  if (rules.length === 0) {
    throw new Error('LIVR: "values" needs rules');
  }

  const livr = { field: rules };
  const validator = new Validator(livr).registerRules(ruleBuilders).prepare();
  const validateValue = validator.getFieldRule('field');

  return (object, params, outputArr) => {
    if (util.isNoValue(object)) return;

    if (!util.isObject(object)) return 'FORMAT_ERROR';

    const result = {};
    let errors = null;
    const valueOutput = [];

    // Own keys only. Keys like "constructor" or "__proto__" are data here
    for (const key of Object.keys(object)) {
      const value = object[key];

      const errCode = validateValue(value, NO_FIELDS, valueOutput);

      if (errCode) {
        if (errors === null) errors = {};
        setOwn(errors, key, errCode);
      } else if (errors === null) {
        setOwn(result, key, valueOutput.length !== 0 ? valueOutput[0] : value);
      }

      valueOutput.length = 0;
    }

    if (errors !== null) return errors;

    outputArr.push(result);
  };
}

// obj[key] = value, also for the key "__proto__", which would set the prototype otherwise
function setOwn(obj, key, value) {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  } else {
    obj[key] = value;
  }
}

module.exports = values;
