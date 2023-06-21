const test = require('ava');
const LIVR = require('../../lib/LIVR');

test('Should support camelized and underscore rules by default', t => {
    const validator = new LIVR.Validator({
        name1: {'maxLength': 5},
        name2: {'max_length': 5},
    });

    const output = validator.validate({
        name1: 'myname1',
        name2: 'myname2'
    });

    t.true(!output, 'should return false due to validation errors');

    t.deepEqual(
        validator.getErrors(),
        {
            name1: 'TOO_LONG',
            name2: 'TOO_LONG'
        },
        'Should contain error codes'
    );
});


test('Camelization should not overide custom rules', t => {
    LIVR.Validator.registerDefaultRules({
        minLength() {
            return () => 'MY_MIN_RULE';
        }  
    });

    const validator = new LIVR.Validator({
        password1: {'maxLength': 5},
        password2: {'minLength': 5},
    });

    validator.registerRules({
        maxLength() {
            return () => 'MY_MAX_RULE';
        }
    });

    const output = validator.validate({
        password1: '123',
        password2: '123',
    });

    t.true(!output, 'should return false due to validation errors');

    t.deepEqual(
        validator.getErrors(),
        {
            password1: 'MY_MAX_RULE',
            password2: 'MY_MIN_RULE',
        },
        'Should contain error codes'
    );
});

test('camelizeRules:false should disable auto camelization of rules names', t => {
    const validator = new LIVR.Validator(
        {name1: {'maxLength': 5} }, 
        {camelizeRules: false}
    );

    const error = t.throws(() => {
        validator.prepare();
    });

    t.is(error.message, 'Rule [maxLength] not registered')
});
