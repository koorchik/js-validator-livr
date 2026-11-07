const util = require('../../util');

const hasOwn = Object.prototype.hasOwnProperty;

// Arguments after the object are ignored
function required_if(conditions) {
  // Without arguments the rule gets only ruleBuilders
  if (arguments.length === 1 || !util.isObject(conditions)) {
    throw new Error('LIVR: "required_if" takes an object of references to values');
  }

  // Paths and the expected values as strings, so that 1 matches "1" and true matches "true":
  // a string for one value, a list of strings for a list of values
  const paths = [];
  const expected = [];

  for (const reference of Object.keys(conditions)) {
    const value = conditions[reference];
    paths.push(parseReference(reference, 'required_if'));

    if (Array.isArray(value)) {
      // An empty list never matches, like ""
      if (value.length === 0) {
        throw new Error(`LIVR: "required_if" got an empty list of values for "${reference}"`);
      }

      const strValues = new Array(value.length);
      for (let i = 0; i < value.length; i++) strValues[i] = toExpectedValue(value[i], reference);
      expected.push(strValues);
    } else {
      expected.push(toExpectedValue(value, reference));
    }
  }

  if (paths.length === 0) {
    throw new Error('LIVR: "required_if" takes an object of references to values');
  }

  return (value, params) => {
    if (!util.isNoValue(value)) return;

    // The field is required when every condition matches a non-empty primitive input value
    for (let i = 0; i < paths.length; i++) {
      const refValue = resolveReference(params, paths[i]);
      if (!util.isPrimitiveValue(refValue) || refValue === '') return;

      const strRefValue = String(refValue);
      const values = expected[i];
      if (typeof values === 'string' ? values !== strRefValue : !values.includes(strRefValue)) {
        return;
      }
    }

    return 'REQUIRED';
  };
}

// An expected value as a string. "" never matches, because an empty value is never a match
function toExpectedValue(value, reference) {
  if (!util.isPrimitiveValue(value) || value === '') {
    throw new Error(
      `LIVR: "required_if" takes a primitive value other than "" or a list of them for "${reference}"`
    );
  }

  return String(value);
}

// A list index: "0" or a number without leading zeros
const INDEX_RE = /^(?:0|[1-9][0-9]*)$/;

// "a/b/0" -> ['a', 'b', '0'], "~1" stands for "/" and "~0" for "~" as in JSON Pointer (RFC 6901).
// Not a string, an empty reference, a leading or a trailing "/", an empty segment ("a//b") and a
// wrong escape ("~2", a trailing "~") are schema errors. A leading "/" is reserved for references
// from the root
function parseReference(reference, ruleName) {
  if (typeof reference !== 'string' || reference === '') {
    throw new Error(`LIVR: a reference of "${ruleName}" must be a non-empty string`);
  }

  // The common case: a field name without escapes
  if (reference.indexOf('/') === -1 && reference.indexOf('~') === -1) return [reference];

  const path = reference.split('/');

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];

    if (segment === '') {
      throw new Error(`LIVR: the reference "${reference}" of "${ruleName}" has an empty segment`);
    }

    if (segment.indexOf('~') !== -1) {
      if (/~(?![01])/.test(segment)) {
        throw new Error(`LIVR: the reference "${reference}" of "${ruleName}" has a wrong escape`);
      }

      path[i] = segment.replace(/~1/g, '/').replace(/~0/g, '~');
    }
  }

  return path;
}

// The input value at the path from the containing object, before the rules of that field.
// undefined when a segment is missing or a value on the way is not an object (or a list for an
// index segment). Own properties only: "constructor" or "__proto__" are not fields of the data
function resolveReference(data, path) {
  let value = data;

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];

    if (Array.isArray(value)) {
      if (!INDEX_RE.test(segment)) return;
    } else if (!util.isObject(value)) {
      return;
    }

    if (!hasOwn.call(value, segment)) return;
    value = value[segment];
  }

  return value;
}

module.exports = required_if;
