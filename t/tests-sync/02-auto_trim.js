const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

const validator = new LIVR.Validator(
  {
    code: 'required',
    password: ['required', { min_length: 3 }],
    list: { list_of: ['string'] },
    address: {
      nested_object: {
        street: { min_length: 5 },
      },
    },
  },
  true
);

test('NEGATIVE: Validate data with automatic trim', () => {
  const output = validator.validate({
    code: '  ',
    password: ' 12  ',
    address: {
      street: '  hell ',
    },
  });

  assert.ok(!output, 'should return false due to validation errors for trimmed values');

  assert.deepEqual(
    validator.getErrors(),
    {
      code: 'REQUIRED',
      password: 'TOO_SHORT',
      address: {
        street: 'TOO_SHORT',
      },
    },
    'Should contain error codes'
  );
});

test('POSITIVE: Validate data with automatic trim', () => {
  const cleanData = validator.validate({
    code: ' A ',
    password: ' 123  ',
    list: [' aaa ', ' bbb '],
    address: {
      street: '  hello ',
    },
  });

  assert.ok(cleanData, 'should return clean data');

  assert.deepEqual(
    cleanData,
    {
      code: 'A',
      password: '123',
      list: ['aaa', 'bbb'],
      address: {
        street: 'hello',
      },
    },
    'Should contain error codes'
  );
});
