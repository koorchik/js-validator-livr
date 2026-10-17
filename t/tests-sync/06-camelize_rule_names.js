const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

test('Should support camelized and underscore rules', () => {
    const validator = new LIVR.Validator({
        name1: { maxLength: 5 },
        name2: { max_length: 5 },
    });

    const output = validator.validate({
        name1: 'myname1',
        name2: 'myname2',
    });

    assert.ok(!output, 'should return false due to validation errors');

    assert.deepEqual(
        validator.getErrors(),
        {
            name1: 'TOO_LONG',
            name2: 'TOO_LONG',
        },
        'Should contain error codes'
    );
});

test('Camelization should not overide custom rules', () => {
    LIVR.Validator.registerDefaultRules({
        minLength() {
            return () => 'MY_MIN_RULE';
        },
    });

    const validator = new LIVR.Validator({
        password1: { maxLength: 5 },
        password2: { minLength: 5 },
    });

    validator.registerRules({
        maxLength() {
            return () => 'MY_MAX_RULE';
        },
    });

    const output = validator.validate({
        password1: '123',
        password2: '123',
    });

    assert.ok(!output, 'should return false due to validation errors');

    assert.deepEqual(
        validator.getErrors(),
        {
            password1: 'MY_MAX_RULE',
            password2: 'MY_MIN_RULE',
        },
        'Should contain error codes'
    );
});

test('Default aliases get camelCase names', () => {
    LIVR.Validator.registerAliasedDefaultRule({ name: 'small_number', rules: { max_number: 10 } });

    const validator = new LIVR.Validator({ a: 'small_number', b: 'smallNumber' });
    assert.equal(validator.validate({ a: 11, b: 12 }), false);
    assert.deepEqual(validator.getErrors(), { a: 'TOO_HIGH', b: 'TOO_HIGH' });

    // A new version of the alias replaces the camelCase name too
    LIVR.Validator.registerAliasedDefaultRule({ name: 'small_number', rules: { max_number: 100 } });
    assert.deepEqual(new LIVR.Validator({ b: 'smallNumber' }).validate({ b: 12 }), { b: 12 });
});

test('Overriding a default rule overrides its camelCase name too', () => {
    const original = LIVR.Validator.getDefaultRules().max_length;
    LIVR.Validator.registerDefaultRules({ max_length: () => () => 'MY_MAX_LENGTH' });

    try {
        const validator = new LIVR.Validator({ a: { max_length: 1 }, b: { maxLength: 1 } });
        assert.equal(validator.validate({ a: 'x', b: 'x' }), false);
        assert.deepEqual(validator.getErrors(), { a: 'MY_MAX_LENGTH', b: 'MY_MAX_LENGTH' });
    } finally {
        LIVR.Validator.registerDefaultRules({ max_length: original });
    }

    assert.deepEqual(new LIVR.Validator({ b: { maxLength: 1 } }).validate({ b: 'x' }), { b: 'x' });
});
