const test = require('ava');
const LIVR = require('../lib/LIVR');

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
