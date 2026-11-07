const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

const hasOwn = Object.prototype.hasOwnProperty;

// A rest parameter instead of slicing `arguments`, which is slow
//   when(reference, condition, rulesIfTrue, [rulesIfFalse], ruleBuilders): the condition form
//   when(reference, cases, ruleBuilders): the switch form
// Arguments after the 4th are ignored
function when(...args) {
  const ruleBuilders = args.pop();

  if (args.length === 2) return buildSwitch(parseReference(args[0], 'when'), args[1], ruleBuilders);

  if (args.length < 2) {
    throw new Error(
      'LIVR: "when" takes a reference and cases, or a reference, a condition, ' +
        `rules if true and optional rules if false, got ${args.length} argument${args.length === 1 ? '' : 's'}`
    );
  }

  if (args.length > 4) args.length = 4;

  const path = parseReference(args[0], 'when');

  // One validator for the condition and the branches: a validator costs more than its rules,
  // and it may be built for every validation
  const fieldRules = buildRules(args, ruleBuilders, 1);
  const conditionRule = fieldRules[1];
  const rulesIfTrue = fieldRules[2];
  const rulesIfFalse = args.length === 4 ? fieldRules[3] : null;

  // Stays synchronous while the rules return plain values, and returns a promise only once
  // a rule returns one
  return (value, allValues, outputArr) => {
    const refValue = resolveReference(allValues, path);

    // An empty referenced value: the condition is false
    if (util.isNoValue(refValue)) return runBranch(rulesIfFalse, value, allValues, outputArr);

    let conditionError;

    try {
      // The condition rules see the siblings of the field, their output is discarded
      conditionError = conditionRule(refValue, allValues, []);
    } catch (error) {
      // An exception of a rule is the error of the field, like in nested_object
      return error;
    }

    if (util.isThenable(conditionError)) {
      return Promise.resolve(conditionError).then(
        asyncConditionError =>
          runBranch(asyncConditionError ? rulesIfFalse : rulesIfTrue, value, allValues, outputArr),
        error => error
      );
    }

    return runBranch(conditionError ? rulesIfFalse : rulesIfTrue, value, allValues, outputArr);
  };
}

function buildSwitch(path, cases, ruleBuilders) {
  if (!util.isObject(cases)) {
    throw new Error('LIVR: the cases of "when" must be an object of value to rules');
  }

  const caseValues = Object.keys(cases);
  if (caseValues.length === 0) throw new Error('LIVR: the cases of "when" must not be empty');

  const ruleSets = new Array(caseValues.length);
  for (let i = 0; i < caseValues.length; i++) ruleSets[i] = cases[caseValues[i]];
  const fieldRules = buildRules(ruleSets, ruleBuilders);

  // Map, so that values like "constructor" or "__proto__" do not match Object.prototype.
  // An unknown value is undefined
  const caseRules = new Map();
  for (let i = 0; i < caseValues.length; i++) caseRules.set(caseValues[i], fieldRules[i]);

  return (value, allValues, outputArr) => {
    const refValue = resolveReference(allValues, path);

    // An empty or unknown referenced value chooses no case. An empty value passes unchanged
    // (the referenced field reports its own errors), any other value would pass unchecked
    const branchRule =
      util.isPrimitiveValue(refValue) && refValue !== ''
        ? caseRules.get(String(refValue))
        : undefined;

    if (branchRule === undefined) return util.isNoValue(value) ? undefined : 'NOT_ALLOWED_VALUE';

    return runBranch(branchRule, value, allValues, outputArr);
  };
}

// The rules of a branch get the value as it is, including empty values, and the siblings of
// the field, so that rules like equal_to_field or a nested "when" work in them.
// Returns the error code, or a promise of it once a rule returns a promise
function runBranch(branchRule, value, allValues, outputArr) {
  // No rules if false: the value passes and stays unchanged
  if (branchRule === null) return;

  let errCode;

  try {
    errCode = branchRule(value, allValues, outputArr);
  } catch (error) {
    // An exception of a rule is the error of the field, like in nested_object
    return error;
  }

  if (util.isThenable(errCode)) {
    // Promise.resolve() also adopts thenables whose then() returns nothing
    return Promise.resolve(errCode).then(
      asyncErrCode => asyncErrCode || undefined,
      error => error
    );
  }

  return errCode;
}

// Rule sets in any form that a field accepts, each as one rule function, all from one validator.
// The first `skip` arguments are not rules, they are null. An empty list of rules is a schema
// error: a field without rules is not in the output, a branch keeps the value. The fields are
// named "rules0",
// "rules1"...: no field is "__proto__", and no field name is an array index, which makes V8
// enumerate the schema (and every schema after it) in a slow way
function buildRules(ruleSets, ruleBuilders, skip = 0) {
  const livr = {};

  for (let i = skip; i < ruleSets.length; i++) {
    const rules = ruleSets[i];

    // Almost always a mistake: "any" is a branch or a case without rules
    if (Array.isArray(rules) && rules.length === 0) {
      throw new Error('LIVR: "when" got an empty list of rules, use "any" for no rules');
    }

    livr[fieldName(i)] = rules;
  }

  const fieldRules = new Array(ruleSets.length).fill(null);
  const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();
  for (let i = skip; i < ruleSets.length; i++) {
    fieldRules[i] = validator.getFieldRule(fieldName(i));
  }

  return fieldRules;
}

// "rules0", "rules1"... Kept, so that V8 turns them into property keys once, not on every build
const FIELD_NAMES = [];

function fieldName(index) {
  if (index >= FIELD_NAMES.length) {
    for (let i = FIELD_NAMES.length; i <= index; i++) FIELD_NAMES.push('rules' + i);
  }

  return FIELD_NAMES[index];
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

module.exports = when;
