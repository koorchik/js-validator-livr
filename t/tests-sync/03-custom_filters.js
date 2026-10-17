const test = require('ava');
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

test('Validate data with registered rules', t => {
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

    t.deepEqual(
        output,
        {
            word1: 'Wordone',
            word2: 'wordtwo',
            word3: 'WordThree '
        },
        'Should apply changes to values'
    );
});

test('list_of, or and aliases pass the same arguments to rules as validate()', t => {
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

    t.deepEqual(output, { list: ['a!!'], any: 'b!', aliased: 'c!', empty: [undefined, undefined] });
    t.deepEqual(calls, [
        ['a', { field: 'a' }],
        ['a!', { field: 'a' }],
        ['b', { field: 'b' }],
        ['b', { field: 'b' }],
        ['c', { value: 'c' }],
    ]);
});
