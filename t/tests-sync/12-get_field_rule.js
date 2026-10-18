const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

test('getFieldRule runs all rules of the field like validate()', () => {
  const validateName = new LIVR.Validator({ name: ['required', 'trim', 'to_uc'] }).getFieldRule(
    'name'
  );

  const output = [];
  assert.equal(validateName(' john ', {}, output), undefined);
  assert.deepEqual(output, ['JOHN']);

  const failedOutput = [];
  assert.equal(validateName('', {}, failedOutput), 'REQUIRED');
  assert.deepEqual(failedOutput, []);
});

test('getFieldRule pushes nothing when the rules do not change the value, like any rule', () => {
  const validateName = new LIVR.Validator({ name: 'integer' }).getFieldRule('name');

  const output = [];
  assert.equal(validateName(undefined, {}, output), undefined);
  assert.equal(validateName('', {}, output), undefined);
  assert.deepEqual(output, []);

  // A missing field stays missing when it goes through an alias or "or"
  const validator = new LIVR.Validator({
    aliased: 'my_integer',
    either: { or: ['integer', 'email'] },
  });
  validator.registerAliasedRule({ name: 'my_integer', rules: 'integer' });
  assert.deepEqual(validator.validate({}), {});
  assert.deepEqual(validator.validate({ aliased: '', either: '' }), { aliased: '', either: '' });
});

test('getFieldRule passes allValues to the rules', () => {
  const validatePassword2 = new LIVR.Validator({
    password2: { equal_to_field: 'password' },
  }).getFieldRule('password2');

  assert.equal(validatePassword2('secret', { password: 'secret' }, []), undefined);
  assert.equal(validatePassword2('secret', { password: 'other' }, []), 'FIELDS_NOT_EQUAL');
});

test('getFieldRule of a field without rules outputs undefined, as validate() leaves it out', () => {
  const validator = new LIVR.Validator({ empty: [] });

  const output = [];
  validator.getFieldRule('empty')('value', {}, output);
  assert.deepEqual(output, [undefined]);
  assert.deepEqual(validator.validate({ empty: 'value' }), {});
});

test('getFieldRule trims values when autoTrim is on', () => {
  const validateName = new LIVR.Validator({ name: 'required' }, true).getFieldRule('name');

  const output = [];
  assert.equal(validateName('  ', {}, []), 'REQUIRED');
  validateName(' john ', {}, output);
  assert.deepEqual(output, ['john']);
});

test('getFieldRule throws for a field that is not in the schema', () => {
  const validator = new LIVR.Validator({ name: 'required' });

  assert.throws(() => validator.getFieldRule('age'), {
    message: 'Field [age] is not in the schema',
  });
  assert.throws(() => validator.getFieldRule('constructor'), {
    message: 'Field [constructor] is not in the schema',
  });
});

test('getFieldRule can be used in custom meta rules', () => {
  const validator = new LIVR.Validator({ tags: { my_list_of: [['required', 'trim']] } });

  validator.registerRules({
    my_list_of(itemRules, ruleBuilders) {
      const itemValidator = new LIVR.Validator({ item: itemRules }).registerRules(ruleBuilders);
      const validateItem = itemValidator.getFieldRule('item');

      return (values, params, outputArr) => {
        const output = [];
        for (const value of values) {
          const itemOutput = [];
          const errCode = validateItem(value, params, itemOutput);
          if (errCode) return errCode;

          // Like any rule, it pushes the value only when the rules change it
          output.push(itemOutput.length ? itemOutput[0] : value);
        }
        outputArr.push(output);
      };
    },
  });

  assert.deepEqual(validator.validate({ tags: [' a ', 'b'] }), { tags: ['a', 'b'] });
  assert.equal(validator.validate({ tags: ['A', ''] }), false);
  assert.deepEqual(validator.getErrors(), { tags: 'REQUIRED' });
});
