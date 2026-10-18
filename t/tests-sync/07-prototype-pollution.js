const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

test('SECURITY: autoTrim should not allow prototype pollution bypass', () => {
  const validator = new LIVR.Validator(
    {
      password: 'required',
      password_confirm: ['required', { equal_to_field: 'password' }],
    },
    { autoTrim: true }
  );

  // Attack: inject password via __proto__ to bypass equal_to_field check
  const attackData = JSON.parse(
    '{"password_confirm": "hacked", "__proto__": {"password": "hacked"}}'
  );

  const result = validator.validate(attackData);

  assert.equal(result, false, 'Validation should fail - password is required');
  assert.deepEqual(
    validator.getErrors(),
    {
      password: 'REQUIRED',
      password_confirm: 'FIELDS_NOT_EQUAL',
    },
    'Should report both password required and fields not equal'
  );
});

test('SECURITY: schema with __proto__ field should not cause errors', () => {
  const schema = JSON.parse('{"name": "required", "__proto__": "required"}');

  const validator = new LIVR.Validator(schema);

  assert.doesNotThrow(() => validator.prepare(), 'prepare() should not throw');
  assert.doesNotThrow(() => validator.validate({ name: 'test' }), 'validate() should not throw');

  const result = validator.validate({ name: 'test' });
  assert.deepEqual(result, { name: 'test' }, 'Should return valid result');
});

test('SECURITY: __proto__ in input should be stripped from output', () => {
  const validator = new LIVR.Validator(
    {
      name: 'required',
    },
    { autoTrim: true }
  );

  const input = JSON.parse('{"name": "test", "__proto__": {"malicious": true}}');
  const result = validator.validate(input);

  assert.ok(result, 'Validation should pass');
  assert.deepEqual(Object.keys(result), ['name'], 'Result should only have name key');
  assert.equal(result.malicious, undefined, 'Malicious property should not be accessible');
  assert.equal(
    Object.getPrototypeOf(result),
    Object.prototype,
    'Result prototype should be Object.prototype'
  );
});

test('SECURITY: Object.prototype should not be polluted', () => {
  const testObj = {};
  assert.equal(
    testObj.polluted,
    undefined,
    'Empty object should not have polluted property before test'
  );

  const validator = new LIVR.Validator(
    {
      name: 'required',
    },
    { autoTrim: true }
  );

  const input = JSON.parse('{"name": "test", "__proto__": {"polluted": "yes"}}');
  validator.validate(input);

  assert.equal(
    testObj.polluted,
    undefined,
    'Object.prototype should not be polluted after validation'
  );
  assert.equal({}.polluted, undefined, 'New empty objects should not have polluted property');
});

test('SECURITY: input with own "hasOwnProperty" key should not crash validation', () => {
  const validator = new LIVR.Validator({ name: 'required', age: 'positive_integer' });

  const input = JSON.parse('{"name": "test", "hasOwnProperty": "x"}');

  assert.deepEqual(validator.validate(input), { name: 'test' });
});

test('SECURITY: schema field named "hasOwnProperty" should work', () => {
  const validator = new LIVR.Validator({ hasOwnProperty: ['required', 'trim'], name: 'required' });

  assert.deepEqual(validator.validate({ hasOwnProperty: ' x ', name: 'test' }), {
    hasOwnProperty: 'x',
    name: 'test',
  });
});

test('SECURITY: rule names like "toString" are not registered rules', () => {
  for (const name of ['toString', 'constructor', 'hasOwnProperty', '__proto__']) {
    const validator = new LIVR.Validator({ field: name });
    assert.throws(() => validator.prepare(), { message: `Rule [${name}] not registered` });
  }
});
