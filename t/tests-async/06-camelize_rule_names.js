const test = require('ava');
const LIVR = require('../../async');

test('Should support camelized and underscore rules by default', async (t) => {
    const validator = new LIVR.AsyncValidator({
        name1: { maxLength: 5 },
        name2: { max_length: 5 },
    });

    try {
        await validator.validate({
            name1: 'myname1',
            name2: 'myname2',
        });
    } catch (errors) {
        t.deepEqual(
            errors,
            {
                name1: 'TOO_LONG',
                name2: 'TOO_LONG',
            },
            'Should contain error codes'
        );
    }
});

test('Camelization should not overide custom rules', async (t) => {
    LIVR.AsyncValidator.registerDefaultRules({
        minLength() {
            return () => 'MY_MIN_RULE';
        },
    });

    const validator = new LIVR.AsyncValidator({
        password1: { maxLength: 5 },
        password2: { minLength: 5 },
    });

    validator.registerRules({
        maxLength() {
            return () => 'MY_MAX_RULE';
        },
    });

    try {
        await validator.validate({
            password1: '123',
            password2: '123',
        });
    } catch (errors) {
        t.deepEqual(
            errors,
            {
                password1: 'MY_MAX_RULE',
                password2: 'MY_MIN_RULE',
            },
            'Should contain error codes'
        );
    }
});
