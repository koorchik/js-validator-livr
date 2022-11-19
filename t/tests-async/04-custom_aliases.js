const test = require('ava');
const LIVR = require('../../async');

LIVR.AsyncValidator.registerAliasedDefaultRule({
    name: 'strong_password1',
    rules: { min_length: 8 },
    error: 'WEAK_PASSWORD1'
});

test('Validate data with registered rules', async (t) => {
    const validator = new LIVR.AsyncValidator({
        password1: 'strong_password1',
        password2: 'strong_password2'
    });

    validator.registerAliasedRule({
        name: 'strong_password2',
        rules: { min_length: 8 },
        error: 'WEAK_PASSWORD2'
    });

    try {
        const output = await validator.validate({
            password1: 'mypass',
            password2: 'mypass'
        });    
    } catch (errors) {
        t.deepEqual(
            errors,
            {
                password1: 'WEAK_PASSWORD1',
                password2: 'WEAK_PASSWORD2'
            },
            'Should contain error codes'
        );    
    }
});
