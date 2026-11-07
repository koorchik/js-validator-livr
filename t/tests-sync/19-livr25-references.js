const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

// JS-specific behavior of references (LIVR 2.5, section 2.5): the containing object through
// aliases, "or" and the rules of list items, the syntax of references, and the switch form of
// "when" with an empty or unknown referenced value

function check(rules, input, aliases = []) {
  const validator = new LIVR.Validator(rules);
  for (const alias of aliases) validator.registerAliasedRule(alias);

  const output = validator.validate(input);
  return output ? { output } : { errors: validator.getErrors() };
}

test('Aliases are transparent: their rules see the siblings of the field', () => {
  const aliases = [{ name: 'vat', rules: { required_if: { type: 'company' } } }];
  const rules = { type: 'string', vat_number: 'vat' };

  assert.deepEqual(check(rules, { type: 'company' }, aliases), {
    errors: { vat_number: 'REQUIRED' },
  });
  assert.deepEqual(check(rules, { type: 'person' }, aliases), { output: { type: 'person' } });

  // An alias with its own error code, used by another alias
  const nestedAliases = [
    { name: 'vat', rules: { required_if: { type: 'company' } }, error: 'VAT_REQUIRED' },
    { name: 'company_vat', rules: ['vat', 'string'] },
  ];
  assert.deepEqual(
    check({ type: 'string', vat_number: 'company_vat' }, { type: 'company' }, nestedAliases),
    { errors: { vat_number: 'VAT_REQUIRED' } }
  );

  // "when" in an alias, both forms
  const whenAliases = [
    { name: 'by_type', rules: { when: ['type', { a: 'integer', b: 'string' }] } },
    { name: 'if_flag', rules: { when: ['flag', 'not_empty', 'required'] } },
  ];
  const whenRules = { type: 'string', flag: 'any', value: 'by_type', other: 'if_flag' };
  assert.deepEqual(check(whenRules, { type: 'a', value: '5' }, whenAliases), {
    output: { type: 'a', value: 5 },
  });
  assert.deepEqual(check(whenRules, { type: 'c', value: '5', flag: 1 }, whenAliases), {
    errors: { value: 'NOT_ALLOWED_VALUE', other: 'REQUIRED' },
  });

  // equal_to_field of LIVR 2.0 reads the siblings too
  const confirmAliases = [{ name: 'confirmation', rules: ['required', { equal_to_field: 'pwd' }] }];
  const confirmRules = { pwd: 'required', confirm: 'confirmation' };
  assert.deepEqual(check(confirmRules, { pwd: 'a', confirm: 'a' }, confirmAliases), {
    output: { pwd: 'a', confirm: 'a' },
  });
  assert.deepEqual(check(confirmRules, { pwd: 'a', confirm: 'b' }, confirmAliases), {
    errors: { confirm: 'FIELDS_NOT_EQUAL' },
  });
});

test('Default aliases are transparent, in the root and in nested objects', () => {
  LIVR.Validator.registerAliasedDefaultRule({
    name: 'references_test_vat',
    rules: ['trim', { required_if: { 'company/type': 'llc' } }],
  });

  const rules = { company: 'any', vat: 'references_test_vat' };

  assert.deepEqual(check(rules, { company: { type: 'llc' } }), { errors: { vat: 'REQUIRED' } });
  assert.deepEqual(check(rules, { company: { type: 'llc' }, vat: ' 1 ' }), {
    output: { company: { type: 'llc' }, vat: '1' },
  });
  assert.deepEqual(check(rules, { company: { type: 'sole' } }), {
    output: { company: { type: 'sole' } },
  });

  // In nested_object and list_of_objects the containing object is the nested one
  assert.deepEqual(
    check({ data: { nested_object: rules } }, { data: { company: { type: 'llc' } } }),
    {
      errors: { data: { vat: 'REQUIRED' } },
    }
  );
  assert.deepEqual(
    check({ items: { list_of_objects: rules } }, { items: [{ company: { type: 'llc' } }, {}] }),
    { errors: { items: [{ vat: 'REQUIRED' }, null] } }
  );
});

test('or is transparent: every rule set sees the siblings of the field', () => {
  const rules = {
    kind: 'string',
    contact: {
      or: [{ when: ['kind', { email: 'email', phone: 'positive_integer' }] }, { eq: '-' }],
    },
  };

  assert.deepEqual(check(rules, { kind: 'phone', contact: '5' }), {
    output: { kind: 'phone', contact: 5 },
  });
  assert.deepEqual(check(rules, { kind: 'email', contact: 'a@example.com' }), {
    output: { kind: 'email', contact: 'a@example.com' },
  });
  assert.deepEqual(check(rules, { kind: 'email', contact: '-' }), {
    output: { kind: 'email', contact: '-' },
  });
  assert.deepEqual(check(rules, { kind: 'phone', contact: 'a@example.com' }), {
    errors: { contact: 'NOT_ALLOWED_VALUE' },
  });

  // equal_to_field of LIVR 2.0 in or
  const confirmRules = {
    pwd: 'required',
    confirm: { or: [{ equal_to_field: 'pwd' }, { eq: '-' }] },
  };
  assert.deepEqual(check(confirmRules, { pwd: 'a', confirm: 'a' }), {
    output: { pwd: 'a', confirm: 'a' },
  });
  assert.deepEqual(check(confirmRules, { pwd: 'a', confirm: 'b' }), {
    errors: { confirm: 'NOT_ALLOWED_VALUE' },
  });
});

test('Items of list_of, values and keys have no containing object', () => {
  // The rules of an item saw the item as a field named "field" before, and aliases saw the value
  // as "value": no reference finds anything there now
  const input = { kind: 'x', field: 'x', value: 'x', 0: 'x', list: ['x'], obj: { x: 'x' } };

  for (const reference of ['kind', 'field', 'value', '0']) {
    const ifPresent = { when: [reference, 'not_empty', { eq: 'never' }] };
    const requiredIf = { required_if: { [reference]: 'x' } };
    const aliases = [{ name: 'my_if_present', rules: ifPresent }];
    const rules = {
      kind: 'any',
      field: 'any',
      value: 'any',
      0: 'any',
      list: [{ list_of: ifPresent }, { list_of: 'my_if_present' }],
      obj: [{ values: ifPresent }, { keys: ifPresent }, { values: 'my_if_present' }],
      missing_items: { list_of: requiredIf },
      missing_values: { values: requiredIf },
    };
    const extra = { missing_items: [null, ''], missing_values: { a: null } };

    assert.deepEqual(
      check(rules, { ...input, ...extra }, aliases),
      { output: { ...input, ...extra } },
      reference
    );

    // The switch form has no case to choose
    const switchRules = { field: 'any', list: { list_of: { when: [reference, { x: 'string' }] } } };
    assert.deepEqual(check(switchRules, { field: 'x', list: ['a', null] }), {
      errors: { list: ['NOT_ALLOWED_VALUE', null] },
    });
  }

  // equal_to_field of LIVR 2.0 in an item of list_of: the other field is missing. It saw the
  // item as a field named "field" before, so { equal_to_field: 'field' } always passed
  const confirmAliases = [{ name: 'confirmation', rules: { equal_to_field: 'pwd' } }];
  for (const itemRules of [
    { equal_to_field: 'pwd' },
    { equal_to_field: 'field' },
    'confirmation',
  ]) {
    const confirmRules = { pwd: 'any', field: 'any', list: { list_of: itemRules } };
    assert.deepEqual(
      check(confirmRules, { pwd: 'a', field: 'a', list: ['a', ''] }, confirmAliases),
      { errors: { list: ['FIELDS_NOT_EQUAL', null] } },
      JSON.stringify(itemRules)
    );
  }

  // The rules of an item can refer to the fields of an object item through nested_object
  const nested = {
    kind: 'any',
    list: { list_of: { nested_object: { kind: 'string', v: { required_if: { kind: 'x' } } } } },
  };
  assert.deepEqual(check(nested, { kind: 'y', list: [{ kind: 'x' }, { kind: 'y' }] }), {
    errors: { list: [{ v: 'REQUIRED' }, null] },
  });
});

test('Wrong references are schema errors of when and required_if', () => {
  const references = [
    1,
    null,
    true,
    ['a'],
    { a: 1 },
    '',
    '/',
    '/a',
    'a/',
    '//',
    'a//b',
    'a/b/',
    '~',
    'a~',
    'a~2',
    'a~/b',
    '~a',
    'a~1~',
    'a/~3/b',
  ];

  for (const reference of references) {
    const message = JSON.stringify(reference);

    for (const rule of [
      { when: [reference, 'not_empty', 'required'] },
      { when: [reference, 'not_empty', 'required', 'string'] },
      { when: [reference, { a: 'string' }] },
    ]) {
      assert.throws(() => new LIVR.Validator({ f: rule }).prepare(), /^Error: LIVR: /, message);
    }

    if (typeof reference === 'string') {
      const rule = { required_if: { a: 'x', [reference]: 'x' } };
      assert.throws(() => new LIVR.Validator({ f: rule }).prepare(), /^Error: LIVR: /, message);
    }
  }
});

test('References: ~1 is "/" and ~0 is "~", in this order', () => {
  const input = { '~1': 'x', '/': 'x', '~': 'x', 'a/b~c': { 'd~1': 'x' } };

  const refersTo = reference => {
    const viaWhen = check({ f: { when: [reference, 'any', 'required'] } }, input);
    const viaRequiredIf = check({ f: { required_if: { [reference]: 'x' } } }, input);
    assert.deepEqual(viaRequiredIf, viaWhen, reference);
    return 'errors' in viaWhen;
  };

  assert.equal(refersTo('~01'), true); // "~1"
  assert.equal(refersTo('~1'), true); // "/"
  assert.equal(refersTo('~0'), true); // "~"
  assert.equal(refersTo('a~1b~0c/d~01'), true);
  assert.equal(refersTo('~10'), false); // "/0"
  assert.equal(refersTo('a~1b~0c/d~1'), false); // "d/"
});

test('References: a segment is an index of a list only as 0 or [1-9][0-9]*', () => {
  const list = ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'];
  const input = {
    list,
    objects: [{ id: 'x' }],
    obj: { '01': 'x', '-1': 'x', length: 'x', 0: { 0: 'x' } },
    str: 'xx',
  };

  const refersTo = reference => {
    const viaWhen = check({ f: { when: [reference, 'any', 'required'] } }, input);
    const viaRequiredIf = check({ f: { required_if: { [reference]: 'x' } } }, input);
    assert.deepEqual(viaRequiredIf, viaWhen, reference);
    return 'errors' in viaWhen;
  };

  for (const reference of ['list/0', 'list/1', 'list/10', 'objects/0/id', 'obj/0/0']) {
    assert.equal(refersTo(reference), true, reference);
  }

  for (const reference of [
    'list/01',
    'list/00',
    'list/-1',
    'list/+1',
    'list/1.0',
    'list/1e1',
    'list/ 1',
    'list/1 ',
    'list/0x1',
    'list/११', // Devanagari digits
    'list/11',
    'list/length',
    'list/at',
    'objects/0/id/0',
    'str/0',
    'str/length',
    'list/0/0',
  ]) {
    assert.equal(refersTo(reference), false, reference);
  }

  // On an object every segment is an ordinary key
  for (const reference of ['obj/01', 'obj/-1', 'obj/length']) {
    assert.equal(refersTo(reference), true, reference);
  }
});

test('when switch: an empty or unknown referenced value lets only an empty value pass', () => {
  const rules = {
    type: { one_of: ['card', 'bank', 'none'] },
    data: {
      when: [
        'type',
        {
          card: { nested_object: { number: ['required', 'positive_integer'] } },
          bank: { nested_object: { iban: ['required', 'string'] } },
          none: 'any',
        },
      ],
    },
  };

  // Without a type, any data passed unchecked before
  for (const type of [undefined, null, '', 'cash', 'toString', true, 1, { card: 1 }, ['card']]) {
    for (const data of [{ anything: 'x' }, 'x', 0, false, []]) {
      const result = check(rules, { type, data });
      assert.equal(result.errors?.data, 'NOT_ALLOWED_VALUE', JSON.stringify({ type, data }));
    }
  }

  // Empty values stay as they are: the referenced field reports its own errors
  assert.deepEqual(check(rules, {}), { output: {} });
  assert.deepEqual(check(rules, { data: null }), { output: { data: null } });
  assert.deepEqual(check(rules, { type: 'cash', data: '' }), {
    errors: { type: 'NOT_ALLOWED_VALUE' },
  });

  // A case with "any" keeps the value
  const data = { anything: ['x'] };
  assert.equal(check(rules, { type: 'none', data }).output.data, data);

  assert.deepEqual(check(rules, { type: 'card', data: { number: '5', x: 1 } }), {
    output: { type: 'card', data: { number: 5 } },
  });
});

test('required_if: "" as an expected value is a schema error, alone or in a list', () => {
  for (const rule of [
    { required_if: { a: '' } },
    { required_if: { a: ['x', ''] } },
    { required_if: { a: [''] } },
    { required_if: { a: null } },
    { required_if: { a: [null] } },
    { required_if: { a: { b: 1 } } },
    { required_if: { a: [['x']] } },
    { required_if: {} },
    { required_if: 'a' },
    { required_if: { a: [] } },
    'required_if',
  ]) {
    const validator = new LIVR.Validator({ f: rule });
    assert.throws(() => validator.prepare(), /^Error: LIVR: /, JSON.stringify(rule));
  }

  // Arguments after the object are ignored
  assert.deepEqual(check({ f: { required_if: [{ a: 'x' }, { b: 'y' }] } }, { a: 'x' }), {
    errors: { f: 'REQUIRED' },
  });
  assert.deepEqual(check({ f: { required_if: { a: [0, false] } } }, { a: 'false' }), {
    errors: { f: 'REQUIRED' },
  });
});
