const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

// JS-specific behavior of the LIVR 2.5 meta rules (when, values, keys, any).
// The rules themselves are covered by the 2.5 test suite

function check(rules, input) {
  const validator = new LIVR.Validator(rules);
  const output = validator.validate(input);
  return output ? { output } : { errors: validator.getErrors() };
}

test('when: wrong arguments are schema errors at build time', () => {
  const schemas = [
    { field: 'when' },
    { field: { when: 'type' } },
    { field: { when: [] } },
    { field: { when: ['type'] } },
    // [] is a schema error everywhere a rule list is: use "any"
    { field: { when: ['type', [], 'string'] } },
    { field: { when: ['type', 'string', []] } },
    { field: { when: ['type', 'string', 'string', []] } },
    { field: { when: ['type', { a: [], b: 'string' }] } },
    { field: { when: ['type', ['string']] } },
    { field: { when: ['type', 'string'] } },
    { field: { when: ['type', null] } },
    { field: { when: [1, 'not_empty', 'required'] } },
    { field: { when: [['type'], { a: 'string' }] } },
    // CASES must have at least one key
    { field: { when: ['type', {}] } },
    // References: see t/tests-sync/19-livr25-references.js
    { field: { when: ['', { a: 'string' }] } },
    { field: { when: ['a~2', 'not_empty', 'required'] } },
  ];

  for (const schema of schemas) {
    const validator = new LIVR.Validator(schema);
    assert.throws(() => validator.prepare(), /^Error: LIVR: /, JSON.stringify(schema));
  }

  // Unknown rules in the branches fail at build time too, not when the branch is used
  const validator = new LIVR.Validator({ field: { when: ['type', { a: 'my_unknown_rule' }] } });
  assert.throws(() => validator.prepare(), /Rule \[my_unknown_rule\] not registered/);
});

test('when: references go down objects and lists, with ~1 and ~0 escapes', () => {
  const rules = { field: { when: ['a/b/0/c~1d~0e', 'not_empty', 'required'] } };

  assert.deepEqual(check(rules, { a: { b: [{ 'c/d~e': 1 }] } }), { errors: { field: 'REQUIRED' } });
  assert.deepEqual(check(rules, { a: { b: { 0: { 'c/d~e': 1 } } } }), {
    errors: { field: 'REQUIRED' },
  });

  // A missing segment or a value on the way that is not an object: the value is missing
  for (const input of [
    {},
    { a: 'x' },
    { a: { b: [] } },
    { a: { b: 'x' } },
    { a: { b: [{ 'c/d~e': '' }] } },
    { a: { b: [{ cde: 1 }] } },
    { a: { b: [{ 'c~1d~0e': 1 }] } },
  ]) {
    assert.deepEqual(check(rules, input), { output: {} }, JSON.stringify(input));
  }

  // A list is indexed by digit segments only
  const lengthRules = { field: { when: ['list/length', 'not_empty', 'required'] } };
  assert.deepEqual(check(lengthRules, { list: [1] }), { output: {} });
});

test('when: inherited properties are not fields of the data', () => {
  for (const reference of [
    'constructor',
    'toString',
    '__proto__',
    'a/constructor',
    'a/hasOwnProperty',
  ]) {
    const rules = { field: { when: [reference, 'not_empty', 'required'] } };
    assert.deepEqual(check(rules, { a: {} }), { output: {} }, reference);
  }

  // Own properties with such names are data
  const input = JSON.parse('{"__proto__": "x", "constructor": "y"}');
  assert.deepEqual(check({ f: { when: ['__proto__', 'not_empty', 'required'] } }, input), {
    errors: { f: 'REQUIRED' },
  });
  assert.deepEqual(check({ f: { when: ['constructor', { eq: 'y' }, 'required'] } }, input), {
    errors: { f: 'REQUIRED' },
  });
});

test('when: without rules if false, or with "any" as a branch, the value is unchanged', () => {
  const value = { a: [1, ' x '] };

  assert.deepEqual(
    check({ field: { when: ['flag', 'not_empty', 'required'] } }, { field: value }),
    {
      output: { field: value },
    }
  );
  assert.deepEqual(
    check({ field: { when: ['flag', 'not_empty', 'required', 'any'] } }, { field: value }),
    { output: { field: value } }
  );
  assert.deepEqual(
    check({ field: { when: ['flag', 'not_empty', 'any', 'required'] } }, { flag: 1, field: value }),
    { output: { field: value } }
  );
  assert.equal(
    check({ field: { when: ['flag', 'not_empty', 'required'] } }, { field: value }).output.field,
    value
  );

  // Empty values stay as they are
  assert.deepEqual(check({ field: { when: ['flag', 'not_empty', 'required'] } }, { field: null }), {
    output: { field: null },
  });
  assert.deepEqual(check({ field: { when: ['flag', 'not_empty', 'required'] } }, { field: '' }), {
    output: { field: '' },
  });

  // "any" as the condition: true for any value that is not empty, "required" is the same
  const noCondition = { field: { when: ['flag', 'any', 'required', 'to_uc'] } };
  assert.deepEqual(check(noCondition, { flag: 0 }), { errors: { field: 'REQUIRED' } });
  assert.deepEqual(check(noCondition, { flag: '', field: 'a' }), { output: { field: 'A' } });
});

test('when: the condition is true only for a filled referenced value that passes the rules', () => {
  const rules = { field: { when: ['flag', 'required', 'required', { eq: '' }] } };

  for (const flag of [false, 0, '0', ' ', [], {}]) {
    assert.deepEqual(check(rules, { flag }), { errors: { field: 'REQUIRED' } }, String(flag));
  }
  for (const flag of [undefined, null, '']) {
    assert.deepEqual(check(rules, { flag, field: 'x' }), {
      errors: { field: 'NOT_ALLOWED_VALUE' },
    });
  }

  // { eq: ... } alone would pass an empty value: false when the field is missing
  const eqRules = { field: { when: ['type', { eq: 'company' }, 'required'] } };
  assert.deepEqual(check(eqRules, {}), { output: {} });
  assert.deepEqual(check(eqRules, { type: 'company' }), { errors: { field: 'REQUIRED' } });
});

test('when: arguments after the 4th are ignored, without a check', () => {
  const rules = { field: { when: ['flag', 'required', 'integer', 'to_uc', [], { x: 1 }] } };

  assert.deepEqual(check(rules, { flag: 1, field: '1.5' }), { errors: { field: 'NOT_INTEGER' } });
  assert.deepEqual(check(rules, { field: 'a' }), { output: { field: 'A' } });
});

test('when: the condition runs as a pipe on the referenced value, its output is discarded', () => {
  const rules = {
    flag: 'any',
    field: { when: ['flag', ['trim', { eq: 'yes' }], ['required', 'to_uc']] },
  };

  assert.deepEqual(check(rules, { flag: ' yes ', field: 'a' }), {
    output: { flag: ' yes ', field: 'A' },
  });
  assert.deepEqual(check(rules, { flag: ' no ', field: 'a' }), {
    output: { flag: ' no ', field: 'a' },
  });
  assert.deepEqual(check(rules, { flag: ' yes ' }), { errors: { field: 'REQUIRED' } });
});

test('when: switch keys are the string forms of primitive values', () => {
  const rules = {
    field: {
      when: ['kind', { true: { eq: 't' }, false: { eq: 'f' }, 1: { eq: 'one' }, 1.5: { eq: 'x' } }],
    },
  };

  assert.deepEqual(check(rules, { kind: true, field: 't' }), { output: { field: 't' } });
  assert.deepEqual(check(rules, { kind: 'false', field: 'f' }), { output: { field: 'f' } });
  assert.deepEqual(check(rules, { kind: 1, field: 'one' }), { output: { field: 'one' } });
  assert.deepEqual(check(rules, { kind: '1', field: 'one' }), { output: { field: 'one' } });
  assert.deepEqual(check(rules, { kind: 1.5, field: 'x' }), { output: { field: 'x' } });
  assert.deepEqual(check(rules, { kind: 1, field: 't' }), {
    errors: { field: 'NOT_ALLOWED_VALUE' },
  });

  for (const kind of ['2', [1], { true: 1 }, ['true'], NaN, 'toString', 'constructor']) {
    assert.deepEqual(
      check(rules, { kind, field: 't' }),
      { errors: { field: 'NOT_ALLOWED_VALUE' } },
      String(kind)
    );
  }

  // Empty referenced values choose no case: only an empty value passes, it stays as it is
  for (const kind of [undefined, null, '']) {
    assert.deepEqual(check(rules, { kind, field: 'zzz' }), {
      errors: { field: 'NOT_ALLOWED_VALUE' },
    });
    assert.deepEqual(check(rules, { kind, field: { a: 1 } }), {
      errors: { field: 'NOT_ALLOWED_VALUE' },
    });
    assert.deepEqual(check(rules, { kind }), { output: {} });
    assert.deepEqual(check(rules, { kind, field: null }), { output: { field: null } });
    assert.deepEqual(check(rules, { kind, field: '' }), { output: { field: '' } });
  }

  // So do unknown values
  assert.deepEqual(check(rules, { kind: 'x', field: '' }), { output: { field: '' } });

  // "any" as a case: the value is kept
  const noRules = { field: { when: ['kind', { a: 'any', b: 'integer' }] } };
  const value = { x: [1] };
  assert.equal(check(noRules, { kind: 'a', field: value }).output.field, value);
  assert.deepEqual(check(noRules, { kind: 'b', field: '1.5' }), {
    errors: { field: 'NOT_INTEGER' },
  });

  // Case keys like "__proto__" and "constructor" are cases like any other
  const protoRules = {
    field: { when: ['kind', JSON.parse('{"__proto__": {"eq": "p"}, "constructor": {"eq": "c"}}')] },
  };
  assert.deepEqual(check(protoRules, { kind: '__proto__', field: 'p' }), {
    output: { field: 'p' },
  });
  assert.deepEqual(check(protoRules, { kind: 'constructor', field: 'p' }), {
    errors: { field: 'NOT_ALLOWED_VALUE' },
  });
  assert.deepEqual(check(protoRules, { kind: 'toString', field: 'p' }), {
    errors: { field: 'NOT_ALLOWED_VALUE' },
  });
});

test('when: branches see the sibling fields, nested when works', () => {
  const rules = {
    password: 'required',
    confirm: { when: ['password', 'not_empty', ['required', { equal_to_field: 'password' }]] },
    a: 'any',
    b: 'any',
    field: {
      when: [
        'a',
        { eq: 'x' },
        { when: ['b', { y: ['required', 'integer'], z: 'absent_like' }] },
        'to_uc',
      ],
    },
  };

  const validator = new LIVR.Validator(rules).registerRules({
    absent_like: () => value => (value === undefined ? undefined : 'NOT_ABSENT'),
  });

  assert.deepEqual(
    validator.validate({ password: 'p', confirm: 'p', a: 'x', b: 'y', field: '5' }),
    {
      password: 'p',
      confirm: 'p',
      a: 'x',
      b: 'y',
      field: 5, // the output of the branch
    }
  );
  assert.equal(validator.validate({ password: 'p', confirm: 'q', a: 'x', b: 'y' }), false);
  assert.deepEqual(validator.getErrors(), { confirm: 'FIELDS_NOT_EQUAL', field: 'REQUIRED' });
  assert.equal(
    validator.validate({ password: 'p', confirm: 'p', a: 'x', b: 'z', field: 1 }),
    false
  );
  assert.deepEqual(validator.getErrors(), { field: 'NOT_ABSENT' });
  assert.deepEqual(
    validator.validate({ password: 'p', confirm: 'p', a: 'x', b: 'w', field: 1 }),
    false
  );
  assert.deepEqual(validator.getErrors(), { field: 'NOT_ALLOWED_VALUE' });
  assert.deepEqual(validator.validate({ password: 'p', confirm: 'p', a: 'q', field: 'v' }), {
    password: 'p',
    confirm: 'p',
    a: 'q',
    field: 'V',
  });
});

test('when: inside list_of_objects the reference is a field of the same item', () => {
  const rules = {
    items: [
      'required',
      {
        list_of_objects: {
          type: ['required', { one_of: ['card', 'bank'] }],
          data: [
            'required',
            {
              when: [
                'type',
                {
                  card: { nested_object: { number: ['required', 'positive_integer'] } },
                  bank: { nested_object: { iban: ['required', 'string'] } },
                },
              ],
            },
          ],
          note: { when: ['data/iban', 'not_empty', 'required'] },
        },
      },
    ],
  };

  assert.deepEqual(
    check(rules, {
      items: [
        { type: 'card', data: { number: '5', extra: 1 } },
        { type: 'bank', data: { iban: 'X' }, note: 'n' },
      ],
    }),
    {
      output: {
        items: [
          { type: 'card', data: { number: 5 } },
          { type: 'bank', data: { iban: 'X' }, note: 'n' },
        ],
      },
    }
  );

  assert.deepEqual(
    check(rules, {
      items: [
        { type: 'card', data: { iban: 'X' } },
        { type: 'bank', data: { iban: 'X' } },
        { type: 'cash', data: {} },
      ],
    }),
    {
      errors: {
        items: [
          // The reference sees the input value of data
          { data: { number: 'REQUIRED' }, note: 'REQUIRED' },
          { note: 'REQUIRED' },
          { type: 'NOT_ALLOWED_VALUE', data: 'NOT_ALLOWED_VALUE' },
        ],
      },
    }
  );
});

test('values and keys: keys like "__proto__" and "constructor" are data, no pollution', () => {
  const input = JSON.parse(
    '{"stock": {"__proto__": "1", "constructor": "2", "toString": "3", "hasOwnProperty": "4"}}'
  );

  const result = check({ stock: { values: 'positive_integer' } }, input);
  const stock = result.output.stock;

  assert.equal(Object.getPrototypeOf(stock), Object.prototype);
  assert.deepEqual(Object.keys(stock), ['__proto__', 'constructor', 'toString', 'hasOwnProperty']);
  assert.equal(Object.getOwnPropertyDescriptor(stock, '__proto__').value, 1);
  assert.equal(stock.constructor, 2);
  assert.equal(
    JSON.stringify(stock),
    '{"__proto__":1,"constructor":2,"toString":3,"hasOwnProperty":4}'
  );
  assert.equal({}.toString, Object.prototype.toString);

  // Errors with such keys
  const badInput = JSON.parse('{"stock": {"__proto__": "x", "constructor": "y", "ok": 1}}');
  const failed = check({ stock: { values: 'positive_integer' } }, badInput);
  assert.equal(Object.getPrototypeOf(failed.errors.stock), Object.prototype);
  assert.equal(
    JSON.stringify(failed.errors),
    '{"stock":{"__proto__":"NOT_POSITIVE_INTEGER","constructor":"NOT_POSITIVE_INTEGER"}}'
  );

  // An object value of "__proto__" does not become the prototype of the output
  const objectInput = JSON.parse('{"stock": {"__proto__": {"polluted": true}}}');
  const objectResult = check({ stock: { values: 'any_object' } }, objectInput);
  assert.equal(objectResult.output.stock.polluted, undefined);
  assert.deepEqual(Object.getOwnPropertyDescriptor(objectResult.output.stock, '__proto__').value, {
    polluted: true,
  });
  assert.equal({}.polluted, undefined);

  // keys checks such keys like any other key
  const keysResult = check({ stock: { keys: { one_of: ['ok'] } } }, badInput);
  assert.equal(Object.getPrototypeOf(keysResult.errors.stock), Object.prototype);
  assert.equal(
    JSON.stringify(keysResult.errors),
    '{"stock":{"__proto__":"WRONG_KEY","constructor":"WRONG_KEY"}}'
  );

  const allowed = check(
    { stock: { keys: { one_of: ['__proto__', 'constructor', 'ok'] } } },
    badInput
  );
  assert.equal(allowed.output.stock, badInput.stock);
});

test('values and keys: objects without prototype, inherited keys are not data', () => {
  const object = Object.create(null);
  object.a = '1';

  assert.deepEqual(check({ f: { values: 'integer' } }, { f: object }), { output: { f: { a: 1 } } });
  assert.deepEqual(check({ f: { keys: { one_of: ['b'] } } }, { f: object }), {
    errors: { f: { a: 'WRONG_KEY' } },
  });

  // Only own keys
  const inherited = Object.create({ inherited: 'x' });
  assert.deepEqual(check({ f: { values: 'integer' } }, { f: inherited }), { output: { f: {} } });
  assert.deepEqual(check({ f: { keys: { one_of: ['a'] } } }, { f: inherited }), {
    output: { f: inherited },
  });
  assert.deepEqual(check({ f: { values: 'integer' } }, { f: new Date() }), {
    errors: { f: 'FORMAT_ERROR' },
  });
  assert.deepEqual(check({ f: { keys: 'string' } }, { f: [1] }), { errors: { f: 'FORMAT_ERROR' } });
  assert.deepEqual(check({ f: { keys: 'string' } }, { f: null }), { output: { f: null } });
});

test('values and keys need rules, any takes no arguments', () => {
  for (const rule of [
    'values',
    { values: [] },
    { values: [[]] },
    'keys',
    { keys: [] },
    { keys: [[]] },
    { any: 1 },
    { any: [1, 2] },
    { any: 'x' },
  ]) {
    const validator = new LIVR.Validator({ f: rule });
    assert.throws(() => validator.prepare(), /^Error: LIVR: /, JSON.stringify(rule));
  }

  assert.deepEqual(check({ f: { any: [] } }, { f: { a: 1 } }), { output: { f: { a: 1 } } });
});

test('keys checks the keys as they are, also when autoTrim is on', () => {
  const rules = { f: { keys: { one_of: ['a'] } } };
  const input = { f: { ' a': 1, a: 2 } };

  const validator = new LIVR.Validator(rules, { autoTrim: true });
  assert.equal(validator.validate(input), false);
  assert.deepEqual(validator.getErrors(), { f: { ' a': 'WRONG_KEY' } });

  LIVR.Validator.defaultAutoTrim(true);
  try {
    assert.deepEqual(check(rules, input), { errors: { f: { ' a': 'WRONG_KEY' } } });

    // The values are trimmed like any input
    assert.deepEqual(check({ f: { values: 'string' } }, { f: { a: ' x ' } }), {
      output: { f: { a: 'x' } },
    });
  } finally {
    LIVR.Validator.defaultAutoTrim(false);
  }
});

test('values and keys take rules like list_of', () => {
  for (const rules of [
    { values: ['required', 'positive_integer'] },
    { values: [['required', 'positive_integer']] },
  ]) {
    assert.deepEqual(check({ f: rules }, { f: { a: '1', b: '' } }), {
      errors: { f: { b: 'REQUIRED' } },
    });
  }

  assert.deepEqual(check({ f: { values: 'positive_integer' } }, { f: { a: '1', b: '' } }), {
    output: { f: { a: 1, b: '' } },
  });

  for (const rules of [
    { keys: ['required', { max_length: 2 }] },
    { keys: [['required', { max_length: 2 }]] },
    { keys: { max_length: 2 } },
  ]) {
    assert.deepEqual(check({ f: rules }, { f: { ab: 1, abc: 2 } }), {
      errors: { f: { abc: 'WRONG_KEY' } },
    });
  }

  // The output of the key rules is ignored
  assert.deepEqual(check({ f: { keys: ['to_uc', { one_of: ['A'] }] } }, { f: { a: 1 } }), {
    output: { f: { a: 1 } },
  });
});

test('any: every value passes unchanged', () => {
  const values = [{ a: [1, { b: null }] }, [1, 'x', {}], 0, false, null, '', ' x ', 1.5];

  for (const value of values) {
    const result = check({ f: 'any', g: { list_of: 'any' } }, { f: value, g: [value] });
    assert.deepEqual(result, { output: { f: value, g: [value] } });
    assert.equal(result.output.f, value);
  }

  assert.deepEqual(check({ f: 'any' }, {}), { output: {} });
  assert.deepEqual(check({ f: ['any', 'required'] }, {}), { errors: { f: 'REQUIRED' } });
});

test('unique with keys: the key values are compared one by one, no collisions', () => {
  const rules = { f: { unique: ['a', 'b'] } };

  for (const items of [
    [
      { a: 'x,y', b: 'z' },
      { a: 'x', b: 'y,z' },
    ],
    [
      { a: '1:x', b: 'y' },
      { a: '1', b: 'x1:y' },
    ],
    [
      { a: '["x"', b: 'y]' },
      { a: '["x","y"]', b: '' },
      { a: '["x"', b: '"y"]' },
    ],
    [
      { a: 'constructor', b: '__proto__' },
      { a: 'constructor', b: 'toString' },
    ],
  ]) {
    assert.deepEqual(check(rules, { f: items }), { output: { f: items } }, JSON.stringify(items));
  }

  // String forms: 1 and "1", true and "true" are equal
  assert.deepEqual(
    check(rules, {
      f: [
        { a: 1, b: true },
        { a: '1', b: 'true' },
      ],
    }),
    { errors: { f: 'NOT_UNIQUE_ITEMS' } }
  );
  assert.deepEqual(
    check(
      { f: { unique: ['a', 'b', 'c'] } },
      {
        f: [
          { a: 1, b: 2, c: 3 },
          { a: 1, b: 2, c: 4 },
        ],
      }
    ),
    {
      output: {
        f: [
          { a: 1, b: 2, c: 3 },
          { a: 1, b: 2, c: 4 },
        ],
      },
    }
  );
  // A wrong type wins over duplicates before it
  assert.deepEqual(
    check(rules, {
      f: [
        { a: 1, b: 2 },
        { a: 1, b: 2 },
        { a: 1, b: [2] },
      ],
    }),
    { errors: { f: 'FORMAT_ERROR' } }
  );
});
