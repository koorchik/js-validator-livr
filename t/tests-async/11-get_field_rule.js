const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../async');

test('getFieldRule returns the result synchronously while rules are synchronous', () => {
    const validateName = new LIVR.AsyncValidator({ name: ['required', 'to_uc'] }).getFieldRule(
        'name'
    );

    const output = [];
    assert.equal(validateName('john', {}, output), undefined);
    assert.deepEqual(output, ['JOHN']);
    assert.equal(validateName('', {}, []), 'REQUIRED');
});

test('getFieldRule returns a promise once a rule returns a promise', async () => {
    const validator = new LIVR.AsyncValidator({ name: ['my_async_trim', 'required', 'to_uc'] });

    validator.registerRules({
        my_async_trim: () => (value, params, outputArr) =>
            new Promise(resolve => setTimeout(() => (outputArr.push(value.trim()), resolve()), 1)),
    });

    const validateName = validator.getFieldRule('name');

    const output = [];
    const pending = validateName(' john ', {}, output);
    assert.equal(LIVR.util.isThenable(pending), true);
    assert.deepEqual(output, []);

    assert.equal(await pending, undefined);
    assert.deepEqual(output, ['JOHN']);

    const failedOutput = [];
    assert.equal(await validateName('  ', {}, failedOutput), 'REQUIRED');
    assert.deepEqual(failedOutput, []);
});

test('getFieldRule awaits thenables and passes rejections on', async () => {
    const validator = new LIVR.AsyncValidator({ name: 'my_thenable', other: 'my_reject' });

    validator.registerRules({
        // then() returns nothing, like in some thenable implementations
        my_thenable: () => value => ({
            then(resolve) {
                resolve(value === 'bad' ? 'BAD' : undefined);
            },
        }),
        my_reject: () => () => Promise.reject(new Error('Boom')),
    });

    assert.equal(await validator.getFieldRule('name')('bad', {}, []), 'BAD');

    // The rule does not change the value, so nothing is pushed
    const output = [];
    assert.equal(await validator.getFieldRule('name')('good', {}, output), undefined);
    assert.deepEqual(output, []);

    await assert.rejects(validator.getFieldRule('other')('value', {}, []), { message: 'Boom' });
});

test('getFieldRule trims values when autoTrim is on', () => {
    const validateName = new LIVR.AsyncValidator({ name: 'required' }, true).getFieldRule('name');

    const output = [];
    assert.equal(validateName('  ', {}, []), 'REQUIRED');
    validateName(' john ', {}, output);
    assert.deepEqual(output, ['john']);
});

test('getFieldRule throws for a field that is not in the schema', () => {
    assert.throws(() => new LIVR.AsyncValidator({ name: 'required' }).getFieldRule('age'), {
        message: 'Field [age] is not in the schema',
    });
});

test('A missing field stays missing when it goes through an alias or "or"', async () => {
    const validator = new LIVR.AsyncValidator({
        aliased: 'my_integer',
        either: { or: ['integer', 'email'] },
    });
    validator.registerAliasedRule({ name: 'my_integer', rules: 'integer' });

    assert.deepEqual(await validator.validate({}), {});
    assert.deepEqual(await validator.validate({ aliased: '', either: '' }), {
        aliased: '',
        either: '',
    });
});
