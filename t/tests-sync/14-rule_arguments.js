const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

// Paths the JSON test suite does not reach: rules with 3+ spread arguments, long one_of lists,
// and rules that push more than one output value
test('one_of accepts spread values of any count', () => {
  const validator = new LIVR.Validator({
    three: { one_of: ['a', 'b', 'c'] },
    four: { one_of: ['a', 'b', 'c', 'd'] },
    five: { one_of: ['a', 'b', 'c', 'd', 'e'] },
  });

  assert.deepEqual(validator.validate({ three: 'c', four: 'd', five: 'e' }), {
    three: 'c',
    four: 'd',
    five: 'e',
  });
  assert.equal(validator.validate({ three: 'x', four: 'x', five: 'x' }), false);
  assert.deepEqual(validator.getErrors(), {
    three: 'NOT_ALLOWED_VALUE',
    four: 'NOT_ALLOWED_VALUE',
    five: 'NOT_ALLOWED_VALUE',
  });
});

test('one_of with a long list works like with a short one', () => {
  const allowedValues = Array.from({ length: 40 }, (_, i) => i);
  allowedValues.push('1'); // a duplicate as a string: the first occurrence wins
  const validator = new LIVR.Validator({ value: { one_of: [allowedValues] } });

  assert.deepEqual(validator.validate({ value: '39' }), { value: 39 });
  assert.deepEqual(validator.validate({ value: 1 }), { value: 1 });
  assert.equal(validator.validate({ value: 40 }), false);
  assert.deepEqual(validator.getErrors(), { value: 'NOT_ALLOWED_VALUE' });
  assert.equal(validator.validate({ value: {} }), false);
  assert.deepEqual(validator.getErrors(), { value: 'FORMAT_ERROR' });
  assert.deepEqual(validator.validate({}), {});
});

test('The first output value of a rule is used, like before', () => {
  const validator = new LIVR.Validator({ a: ['my_two_outputs', 'to_uc'], b: 'required' });

  validator.registerRules({
    my_two_outputs: () => (value, params, outputArr) => {
      outputArr.push(value + '1', value + '2');
    },
  });

  assert.deepEqual(validator.validate({ a: 'x', b: 'y' }), { a: 'X1', b: 'y' });
  assert.deepEqual(validator.getFieldRule('a')('z', {}, []), undefined);
});

// LIVR 2.0 rules ignore the arguments after the ones they take (LIVR 2.5, 2.6): meta rules keep the
// rules of the validator (ruleBuilders is the last argument), like keeps its flags
const ARGUMENT_RULES = { my_word: () => value => (value === 'bad' ? 'BAD' : undefined) };
const EXTRA_ARGUMENTS_SCHEMA = {
  nested: { nested_object: [{ a: 'my_word' }, 'ignored'] },
  objects: { list_of_objects: [{ a: 'my_word' }, 'ignored'] },
  variable: { variable_object: ['t', { x: { a: 'my_word' } }, 'ignored'] },
  different: { list_of_different_objects: ['t', { x: { a: 'my_word' } }, 'ignored'] },
  list: { list_of: [['my_word'], 'ignored'] },
  values: { values: [['my_word'], 'ignored'] },
  keys: { keys: [['my_word'], 'ignored'] },
  like: { like: ['^[a-z]+$', 'i', 'ignored'] },
  required: { required: ['ignored'] },
  minLength: { min_length: [2, 'ignored'] },
};
const EXTRA_ARGUMENTS_BAD = {
  nested: { a: 'bad' },
  objects: [{ a: 'bad' }],
  variable: { t: 'x', a: 'bad' },
  different: [{ t: 'x', a: 'bad' }],
  list: ['bad'],
  values: { k: 'bad' },
  keys: { bad: 1 },
  like: '1',
  minLength: 'a',
};
const EXTRA_ARGUMENTS_ERRORS = {
  nested: { a: 'BAD' },
  objects: [{ a: 'BAD' }],
  variable: { a: 'BAD' },
  different: [{ a: 'BAD' }],
  list: ['BAD'],
  values: { k: 'BAD' },
  keys: { bad: 'WRONG_KEY' },
  like: 'WRONG_FORMAT',
  required: 'REQUIRED',
  minLength: 'TOO_SHORT',
};

test('Rules with arguments ignore extra arguments, meta rules keep the registered rules', () => {
  const validator = new LIVR.Validator(EXTRA_ARGUMENTS_SCHEMA).registerRules(ARGUMENT_RULES);

  assert.equal(validator.validate(EXTRA_ARGUMENTS_BAD), false);
  assert.deepEqual(validator.getErrors(), EXTRA_ARGUMENTS_ERRORS);
  assert.deepEqual(validator.validate({ like: 'ABC', required: 'x' }), {
    like: 'ABC',
    required: 'x',
  });
});

test('Async rules with arguments ignore extra arguments, meta rules keep the registered rules', async () => {
  const AsyncLIVR = require('../../async');
  const validator = new AsyncLIVR.AsyncValidator(EXTRA_ARGUMENTS_SCHEMA).registerRules(
    ARGUMENT_RULES
  );

  await assert.rejects(validator.validate(EXTRA_ARGUMENTS_BAD), errors => {
    assert.deepEqual(errors, EXTRA_ARGUMENTS_ERRORS);
    return true;
  });
});

// LIVR 2.5 rules: { rule: null } is one null argument, a schema error, also for the rules that
// take no arguments or optional ones
const LIVR_25_RULES = [
  'any',
  'boolean',
  'digits',
  'iso_datetime',
  'iso_time',
  'unique',
  'uuid',
  'ip',
  'cidr',
  'hostname',
  'base64',
  'hex',
  'mongo_id',
  'hex_color',
  'mac',
  'e164',
  'semver',
  'jwt',
  'luhn',
  'credit_card',
  'iban',
  'required_if',
  'not_one_of',
  'starts_with',
  'ends_with',
  'contains',
  'max_decimals',
  'list_length',
  'split',
  'digest',
  'when',
  'values',
  'keys',
];

const NULL_ARGUMENT_VALUES = [
  '',
  'x',
  '1',
  0,
  1.5,
  true,
  '2026-01-02',
  '2026-02-30',
  '2026-01-02T03:04:05Z',
  ['a', 'a'],
  { a: 1 },
];

test('{ rule: null } is a null argument, a schema error for the LIVR 2.5 rules', async () => {
  const AsyncLIVR = require('../../async');

  // values and keys take null as their rules: "Rule [null] not registered"
  const schemaError = /^Error: (LIVR: |Rule \[null\] not registered)/;

  for (const name of LIVR_25_RULES) {
    assert.throws(
      () => new LIVR.Validator({ field: { [name]: null } }).prepare(),
      schemaError,
      name
    );
    assert.throws(
      () => new AsyncLIVR.AsyncValidator({ field: { [name]: null } }).prepare(),
      schemaError,
      `async ${name}`
    );
    assert.throws(
      () => new LIVR.Validator({ field: { [name]: [null, 'x'] } }).prepare(),
      schemaError,
      `${name}: [null, "x"]`
    );
  }
});

test('{ iso_date: null } is the plain iso_date: LIVR 2.0 ignored the arguments of iso_date', async () => {
  const AsyncLIVR = require('../../async');

  const plain = new LIVR.Validator({ field: 'iso_date' });
  const withNull = new LIVR.Validator({ field: { iso_date: null } });
  const asyncWithNull = new AsyncLIVR.AsyncValidator({ field: { iso_date: null } });

  for (const value of NULL_ARGUMENT_VALUES) {
    const expected = plain.validate({ field: value }) || plain.getErrors();
    assert.deepEqual(
      withNull.validate({ field: value }) || withNull.getErrors(),
      expected,
      JSON.stringify(value)
    );
    assert.deepEqual(
      await asyncWithNull.validate({ field: value }).catch(errors => errors),
      expected,
      `async ${JSON.stringify(value)}`
    );
  }

  // null with other arguments is a wrong argument
  assert.throws(
    () => new LIVR.Validator({ field: { iso_date: [null, 'x'] } }).prepare(),
    /^Error: LIVR: /
  );
});

test('LIVR 2.0 rules and custom rules get { rule: null } as a null argument, like in LIVR 2.0', () => {
  // default sets the field to null
  const validator = new LIVR.Validator({ field: { default: null }, other: { trim: null } });
  assert.deepEqual(validator.validate({ other: ' x ' }), { field: null, other: 'x' });
  assert.deepEqual(validator.validate({ field: '', other: null }), { field: null, other: null });
  assert.deepEqual(validator.validate({ field: 0 }), { field: 0 });

  const received = [];
  const custom = new LIVR.Validator({ field: { my_rule: null } }).registerRules({
    my_rule(...args) {
      received.push(args.slice(0, -1)); // without ruleBuilders
      return () => {};
    },
  });
  custom.prepare();
  assert.deepEqual(received, [[null]]);
});
