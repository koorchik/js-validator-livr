const test = require('node:test');
const assert = require('node:assert/strict');
const querystring = require('querystring');
const LIVR = require('../../lib/LIVR');

// Cases the JSON test suite cannot express

const nullProto = props => Object.assign(Object.create(null), props);

test('util.isObject accepts plain objects only', () => {
  const { isObject } = LIVR.util;

  assert.equal(isObject({}), true);
  assert.equal(isObject({ constructor: 'value' }), true);
  assert.equal(isObject(Object.create(null)), true);
  assert.equal(isObject(Object.create({})), true);

  for (const value of [null, undefined, 'str', 1, [], new Date(), new Map(), new (class A {})()]) {
    assert.equal(isObject(value), false);
  }
});

test('Objects without prototype are validated as objects', () => {
  const productRules = ['type', { book: { type: 'required', title: 'required' } }];

  const validator = new LIVR.Validator({
    name: 'required',
    address: { nested_object: { city: 'required' } },
    meta: 'any_object',
    items: { list_of_objects: { id: 'positive_integer' } },
    product: { variable_object: productRules },
    products: { list_of_different_objects: productRules },
  });

  const output = validator.validate(
    nullProto({
      name: 'John',
      address: nullProto({ city: 'Kyiv' }),
      meta: nullProto({ key: 'value' }),
      items: [nullProto({ id: '1' })],
      product: nullProto({ type: 'book', title: 'LIVR' }),
      products: [nullProto({ type: 'book', title: 'LIVR' })],
    })
  );

  assert.ok(output, JSON.stringify(validator.getErrors()));
  assert.deepEqual(
    { ...output, meta: { ...output.meta } },
    {
      name: 'John',
      address: { city: 'Kyiv' },
      meta: { key: 'value' },
      items: [{ id: 1 }],
      product: { type: 'book', title: 'LIVR' },
      products: [{ type: 'book', title: 'LIVR' }],
    }
  );
});

test('querystring.parse() output is validated and auto trimmed', () => {
  const validator = new LIVR.Validator(
    { name: 'required', age: 'positive_integer' },
    { autoTrim: true }
  );

  const output = validator.validate(querystring.parse('name=%20John%20&age=30&extra=1'));
  assert.deepEqual(output, { name: 'John', age: 30 });
});

test('autoTrim trims objects with own "constructor" key', () => {
  const validator = new LIVR.Validator(
    { user: { nested_object: { constructor: 'required', name: 'required' } } },
    { autoTrim: true }
  );

  const output = validator.validate({ user: { constructor: ' value ', name: ' John ' } });
  assert.deepEqual(output, { user: { constructor: 'value', name: 'John' } });
});

test('Class instances and arrays are not objects', () => {
  const validator = new LIVR.Validator({
    object: 'any_object',
    nested: { nested_object: { name: 'required' } },
  });

  for (const value of [[], new Date(), new Map(), new (class User {})()]) {
    assert.equal(validator.validate({ object: value, nested: value }), false);
    assert.deepEqual(validator.getErrors(), { object: 'FORMAT_ERROR', nested: 'FORMAT_ERROR' });
  }
});

test('Validators filled or changed by a subclass are used', () => {
  class OwnValidators extends LIVR.Validator {
    prepare() {
      this.validators = { a: [() => 'ERR'] };
      this.isPrepared = true;
      return this;
    }
  }

  class ExtraField extends LIVR.Validator {
    prepare() {
      super.prepare();
      this.validators.extra = [() => 'EXTRA_ERR'];
      return this;
    }
  }

  const own = new OwnValidators({});
  assert.equal(own.validate({ a: 1 }), false);
  assert.deepEqual(own.getErrors(), { a: 'ERR' });

  const extra = new ExtraField({ name: 'required' });
  assert.equal(extra.validate({ name: 'x' }), false);
  assert.deepEqual(extra.getErrors(), { extra: 'EXTRA_ERR' });
});
