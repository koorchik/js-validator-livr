const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');
const AsyncLIVR = require('../../async');

// JS-specific behavior of the async LIVR 2.5 meta rules (when, values, keys, any):
// the same results as the sync ones, also with rules that return promises

const delay = () => new Promise(resolve => setTimeout(resolve, 1));

// The same custom rules for both validators, the async ones return promises
const syncRules = {
  my_upper: () => (value, params, outputArr) => {
    if (typeof value === 'string') outputArr.push(value.toUpperCase());
  },
  my_not_bad: () => value => (value === 'bad' ? 'BAD' : undefined),
};

const asyncRules = {
  my_upper: () => async (value, params, outputArr) => {
    await delay();
    if (typeof value === 'string') outputArr.push(value.toUpperCase());
  },
  my_not_bad: () => async value => {
    await delay();
    return value === 'bad' ? 'BAD' : undefined;
  },
};

function checkSync(rules, input) {
  const validator = new LIVR.Validator(rules).registerRules(syncRules);
  const output = validator.validate(input);
  return output ? { output } : { errors: validator.getErrors() };
}

async function checkAsync(rules, input, customRules = asyncRules) {
  const validator = new AsyncLIVR.AsyncValidator(rules).registerRules(customRules);

  try {
    return { output: await validator.validate(input) };
  } catch (errors) {
    return { errors };
  }
}

const cases = [
  // when: condition form
  [
    {
      email: { when: ['phone', 'not_empty', 'email', ['required', 'email']] },
      phone: { when: ['email', 'not_empty', 'string', ['required', 'string']] },
    },
    [{}, { email: 'a@example.com' }, { phone: '1' }, { email: 'bad', phone: '1' }],
  ],
  [
    {
      flag: 'any',
      field: {
        when: ['flag', ['my_upper', { eq: 'YES' }], ['required', 'my_upper'], 'my_not_bad'],
      },
    },
    [
      { flag: 'yes', field: 'a' },
      { flag: 'yes' },
      { flag: 'no', field: 'bad' },
      { flag: 'no', field: 'a' },
      { field: 'bad' },
      { field: 'a' },
    ],
  ],
  [
    { field: { when: ['flag', 'any', 'my_upper', 'my_not_bad'] } },
    [
      { flag: 1, field: 'a' },
      { flag: '', field: 'bad' },
    ],
  ],
  [
    { field: { when: ['flag', 'not_empty', 'my_upper'] } },
    [{ field: 'a' }, { flag: 1, field: 'a' }],
  ],
  // when: switch form
  [
    {
      type: ['required', { one_of: ['card', 'bank'] }],
      data: [
        'required',
        {
          when: [
            'type',
            {
              card: { nested_object: { number: ['required', 'my_not_bad'] } },
              bank: ['my_not_bad', 'my_upper'],
            },
          ],
        },
      ],
    },
    [
      { type: 'card', data: { number: '1', x: 1 } },
      { type: 'card', data: { number: 'bad' } },
      { type: 'bank', data: 'iban' },
      { type: 'bank', data: 'bad' },
      { type: 'cash', data: 'x' },
      { type: { a: 1 }, data: 'x' },
      { data: 'x' },
      { data: { number: 'bad' } },
      { type: 'cash', data: null },
    ],
  ],
  [
    { field: { when: ['kind', { a: 'any', b: 'my_upper' }] } },
    [
      { kind: 'a', field: { x: 1 } },
      { kind: 'b', field: 'x' },
      { kind: 'c', field: 'x' },
      { kind: 'c', field: '' },
      { field: 'x' },
      {},
    ],
  ],
  // when: references down objects and lists
  [
    { field: { when: ['a/0/b~1c', 'not_empty', 'required'] } },
    [
      { a: [{ 'b/c': 1 }] },
      { a: { 0: { 'b/c': 1 } } },
      { a: [{ 'b/c': '' }] },
      { a: { x: 1 } },
      { a: [1] },
      { a: 'x' },
      {},
    ],
  ],
  [{ field: { when: ['a/length', 'not_empty', 'required'] } }, [{ a: [1] }]],
  // when: nested, inside list_of_objects with sibling fields
  [
    {
      items: {
        list_of_objects: {
          a: 'any',
          b: 'any',
          field: {
            when: [
              'a',
              { eq: 'x' },
              { when: ['b', { y: ['required', 'my_upper'] }] },
              'my_not_bad',
            ],
          },
        },
      },
    },
    [
      {
        items: [
          { a: 'x', b: 'y', field: 'v' },
          { a: 'z', field: 'v' },
        ],
      },
      {
        items: [
          { a: 'x', b: 'y' },
          { a: 'z', field: 'bad' },
          { a: 'x', b: 'q', field: 1 },
        ],
      },
    ],
  ],
  // values
  [
    { stock: { values: ['required', 'my_not_bad', 'my_upper'] } },
    [
      { stock: { a: 'x', b: 'y' } },
      { stock: { a: 'bad', b: 'y', c: '' } },
      { stock: {} },
      { stock: [] },
      { stock: 'x' },
      { stock: null },
      { stock: JSON.parse('{"__proto__": "p", "constructor": "bad"}') },
    ],
  ],
  [{ stock: { values: [['my_upper']] } }, [{ stock: { a: 'x' } }]],
  // keys
  [
    { t: [{ keys: ['my_not_bad', { one_of: ['uk', 'en', 'bad'] }] }, { values: 'my_upper' }] },
    [
      { t: { uk: 'a', en: 'b' } },
      { t: { uk: 'a', fr: 'b', bad: 'c' } },
      { t: [] },
      { t: {} },
      { t: JSON.parse('{"__proto__": "p", "en": "x"}') },
      { t: null },
    ],
  ],
  // any
  [{ f: 'any', g: { list_of: 'any' } }, [{ f: { a: [1] }, g: [null, {}] }, { f: null }, {}]],
];

test('Sync and async meta rules give the same results, also with async custom rules', async () => {
  for (const [rules, inputs] of cases) {
    for (const input of inputs) {
      const expected = checkSync(rules, input);
      const message = JSON.stringify({ rules, input });

      assert.deepEqual(await checkAsync(rules, input), expected, message);
      assert.deepEqual(await checkAsync(rules, input, syncRules), expected, message);
    }
  }
});

test('Async meta rules return a promise only when a rule returns one', async () => {
  const noRules = {};

  const syncWhen = AsyncLIVR.rules.when('flag', 'not_empty', ['required', 'to_uc'], noRules);
  const output = [];
  assert.equal(syncWhen('a', { flag: 1 }, output), undefined);
  assert.deepEqual(output, ['A']);
  assert.equal(syncWhen('', { flag: 1 }, []), 'REQUIRED');

  const syncValues = AsyncLIVR.rules.values('positive_integer', noRules);
  const valuesOutput = [];
  assert.equal(syncValues({ a: '1' }, {}, valuesOutput), undefined);
  assert.deepEqual(valuesOutput, [{ a: 1 }]);

  assert.equal(AsyncLIVR.rules.keys({ one_of: ['a'] }, noRules)({ a: 1 }, {}, []), undefined);
  assert.deepEqual(AsyncLIVR.rules.keys({ one_of: ['a'] }, noRules)({ b: 1 }, {}, []), {
    b: 'WRONG_KEY',
  });

  // With a rule that returns a promise
  const asyncWhen = AsyncLIVR.rules.when('flag', 'my_not_bad', 'my_upper', asyncRules);
  const asyncOutput = [];
  const pending = asyncWhen('a', { flag: 1 }, asyncOutput);
  assert.equal(AsyncLIVR.util.isThenable(pending), true);
  assert.equal(await pending, undefined);
  assert.deepEqual(asyncOutput, ['A']);
});

test('Async meta rules: wrong arguments are schema errors at build time', () => {
  for (const schema of [
    { field: { when: 'type' } },
    { field: { when: ['type'] } },
    { field: { when: ['type', [], 'string'] } },
    { field: { when: ['type', 'string', 'string', []] } },
    { field: { when: ['type', { a: [] }] } },
    { field: { when: ['type', 'string'] } },
    { field: { when: [1, 'not_empty', 'required'] } },
    { field: { when: ['type', {}] } },
    { field: { when: ['a//b', { a: 'string' }] } },
    { field: { when: ['a~', 'not_empty', 'required'] } },
    { field: 'values' },
    { field: { values: [] } },
    { field: { keys: [[]] } },
    { field: { values: [[]] } },
    { field: { any: 1 } },
  ]) {
    const validator = new AsyncLIVR.AsyncValidator(schema);
    assert.throws(() => validator.prepare(), /^Error: LIVR: /, JSON.stringify(schema));
  }
});

test('Async meta rules: an exception or a rejection of a rule is the error', async () => {
  const error = new Error('Boom');
  const failingRules = {
    my_throw: () => () => {
      throw error;
    },
    my_reject: () => () => Promise.reject(error),
    // then() returns nothing, like in some thenable implementations
    my_thenable: () => value => ({
      then(resolve) {
        resolve(value === 'bad' ? 'BAD' : undefined);
      },
    }),
  };

  const check = (rules, input) => checkAsync(rules, input, failingRules);

  for (const rule of ['my_throw', 'my_reject']) {
    // when: in the condition and in a branch
    assert.deepEqual(await check({ f: { when: ['flag', rule, 'required'] } }, { flag: 1 }), {
      errors: { f: error },
    });
    assert.deepEqual(await check({ f: { when: ['flag', 'not_empty', rule] } }, { flag: 1 }), {
      errors: { f: error },
    });
    assert.deepEqual(await check({ f: { when: ['flag', { a: rule }] } }, { flag: 'a' }), {
      errors: { f: error },
    });

    // values: the error of the value
    assert.deepEqual(await check({ f: { values: rule } }, { f: { a: 1, b: 2 } }), {
      errors: { f: { a: error, b: error } },
    });

    // keys: the error of the key, like in values. A rule that fails gives WRONG_KEY
    assert.deepEqual(await check({ f: { keys: rule } }, { f: { a: 1 } }), {
      errors: { f: { a: error } },
    });
  }

  assert.deepEqual(
    await check({ f: { when: ['flag', 'my_thenable', 'my_thenable', 'required'] } }, { flag: 1 }),
    { output: {} }
  );
  assert.deepEqual(
    await check({ f: { when: ['flag', 'my_thenable', 'my_thenable'] } }, { flag: 1, f: 'bad' }),
    { errors: { f: 'BAD' } }
  );
  assert.deepEqual(
    await check({ f: { when: ['flag', 'my_thenable', 'required'] } }, { flag: 'bad', f: 'x' }),
    { output: { f: 'x' } }
  );
});

test('Async values and keys: keys like "__proto__" are data, no pollution', async () => {
  const input = JSON.parse('{"stock": {"__proto__": {"polluted": true}, "constructor": "x"}}');
  const stock = (await checkAsync({ stock: { values: ['any', 'my_upper'] } }, input)).output.stock;
  assert.equal(Object.getPrototypeOf(stock), Object.prototype);
  assert.equal(stock.polluted, undefined);
  assert.deepEqual(Object.getOwnPropertyDescriptor(stock, '__proto__').value, { polluted: true });
  assert.equal({}.polluted, undefined);

  const keysResult = await checkAsync(
    { stock: { keys: ['my_not_bad', { one_of: ['ok'] }] } },
    input
  );
  assert.equal(Object.getPrototypeOf(keysResult.errors.stock), Object.prototype);
  assert.equal(
    JSON.stringify(keysResult.errors),
    '{"stock":{"__proto__":"WRONG_KEY","constructor":"WRONG_KEY"}}'
  );

  const valuesErrors = await checkAsync(
    { stock: { values: ['my_not_bad', 'integer'] } },
    JSON.parse('{"stock": {"__proto__": "bad", "a": "1"}}')
  );
  assert.equal(Object.getPrototypeOf(valuesErrors.errors.stock), Object.prototype);
  assert.equal(JSON.stringify(valuesErrors.errors), '{"stock":{"__proto__":"BAD"}}');
});

test('Async keys checks the keys as they are, also when autoTrim is on', async () => {
  const rules = { f: { keys: { one_of: ['a'] } } };
  const input = { f: { ' a': 1, a: 2 } };

  const validator = new AsyncLIVR.AsyncValidator(rules, { autoTrim: true });
  await assert.rejects(validator.validate(input), { f: { ' a': 'WRONG_KEY' } });

  AsyncLIVR.AsyncValidator.defaultAutoTrim(true);
  try {
    assert.deepEqual(await checkAsync(rules, input), { errors: { f: { ' a': 'WRONG_KEY' } } });
  } finally {
    AsyncLIVR.AsyncValidator.defaultAutoTrim(false);
  }
});
