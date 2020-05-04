const test = require('ava');
const LIVR = require('../lib/LIVR');

LIVR.Validator.registerAliasedDefaultRule({
    name: 'strong_password1',
    rules: { min_length: 8 },
    error: 'WEAK_PASSWORD1'
});

test('Validate data with registered rules', t => {
    const validator = new LIVR.Validator({
        password1: 'strong_password1',
        password2: 'strong_password2'
    });

    validator.registerAliasedRule({
        name: 'strong_password2',
        rules: { min_length: 8 },
        error: 'WEAK_PASSWORD2'
    });

    const output = validator.validate({
        password1: 'mypass',
        password2: 'mypass'
    });

    t.true(!output, 'should return false due to validation errors');

    t.deepEqual(
        validator.getErrors(),
        {
            password1: 'WEAK_PASSWORD1',
            password2: 'WEAK_PASSWORD2'
        },
        'Should contain error codes'
    );
});
