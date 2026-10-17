const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

LIVR.Validator.registerDefaultRules({
    my_trim() {
        return (value, undefined, outputArr) => {
            if (value === undefined || value === null || typeof value === 'object' || value === '')
                return;

            value += '';
            outputArr.push(value.replace(/^\s*/, '').replace(/\s*$/, ''));
        };
    },

    my_lc() {
        return (value, undefined, outputArr) => {
            if (value === undefined || value === null || typeof value === 'object' || value === '')
                return;

            value += '';
            outputArr.push(value.toLowerCase());
        };
    },

    my_ucfirst() {
        return (value, undefined, outputArr) => {
            if (value === undefined || value === null || typeof value === 'object' || value === '')
                return;

            value += '';
            outputArr.push(value.charAt(0).toUpperCase() + value.slice(1));
        };
    }
});

test('Validate data with registered rules', () => {
    const validator = new LIVR.Validator({
        word1: ['my_trim', 'my_lc', 'my_ucfirst'],
        word2: ['my_trim', 'my_lc'],
        word3: ['my_ucfirst']
    });

    const output = validator.validate({
        word1: ' wordOne ',
        word2: ' wordTwo ',
        word3: 'wordThree '
    });

    assert.deepEqual(
        output,
        {
            word1: 'Wordone',
            word2: 'wordtwo',
            word3: 'WordThree '
        },
        'Should apply changes to values'
    );
});

test('list_of, or and aliases pass the same arguments to rules as validate()', () => {
    const calls = [];
    const validator = new LIVR.Validator({
        list: { list_of: ['my_spy', 'my_spy'] },
        any: { or: [['my_spy', { eq: 'nope' }], ['my_spy']] },
        aliased: 'my_spied_alias',
        empty: { list_of: [] },
    });

    validator.registerRules({
        my_spy() {
            return (value, allValues, outputArr) => {
                calls.push([value, allValues]);
                outputArr.push(value + '!');
            };
        },
    });
    validator.registerAliasedRule({ name: 'my_spied_alias', rules: ['my_spy'] });

    const output = validator.validate({ list: ['a'], any: 'b', aliased: 'c', empty: [1, 2] });

    assert.deepEqual(output, { list: ['a!!'], any: 'b!', aliased: 'c!', empty: [undefined, undefined] });
    assert.deepEqual(calls, [
        ['a', { field: 'a' }],
        ['a!', { field: 'a' }],
        ['b', { field: 'b' }],
        ['b', { field: 'b' }],
        ['c', { value: 'c' }],
    ]);
});

test('Rules edge cases keep their results', () => {
    const validator = new LIVR.Validator({
        emails: { list_of: 'email' },
        dates: { list_of: 'iso_date' },
        choice: { one_of: ['1', 1, 'b'] },
        other: { one_of: [1, '1'] },
    });

    validator.validate({
        emails: ['a@b.com', 'a_b@c.com', 'a@b_c.com', 'a@b@c.com', 'ab.com', 'a@b\n_c.com', '"q"@b.com'],
        dates: ['2024-02-29', '2023-02-29', '2024-13-01', '2024-00-10', '0000-01-31', '2024-1-01', '2024-01-01\n'],
        choice: 1,
        other: '1',
    });

    assert.deepEqual(validator.getErrors(), {
        emails: [null, null, 'WRONG_EMAIL', 'WRONG_EMAIL', 'WRONG_EMAIL', 'WRONG_EMAIL', null],
        dates: [null, 'WRONG_DATE', 'WRONG_DATE', 'WRONG_DATE', null, 'WRONG_DATE', 'WRONG_DATE'],
    });

    const output = new LIVR.Validator({ choice: { one_of: ['1', 1, 'b'] }, other: { one_of: [1, '1'] } })
        .validate({ choice: 1, other: '1' });

    assert.deepEqual(output, { choice: '1', other: 1 }, 'one_of returns the first matching allowed value');
});
