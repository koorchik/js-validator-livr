const test = require('ava');
const LIVR = require('../lib/LIVR');

const validator = new LIVR.Validator(
    {
        code: 'required',
        password: ['required', { min_length: 3 }],
        list: { list_of: ['string'] },
        address: {
            nested_object: {
                street: { min_length: 5 }
            }
        }
    },
    true
);

test('NEGATIVE: Validate data with automatic trim', t => {
    const output = validator.validate({
        code: '  ',
        password: ' 12  ',
        address: {
            street: '  hell '
        }
    });

    t.true(!output, 'should return false due to validation errors for trimmed values');

    t.deepEqual(
        validator.getErrors(),
        {
            code: 'REQUIRED',
            password: 'TOO_SHORT',
            address: {
                street: 'TOO_SHORT'
            }
        },
        'Should contain error codes'
    );
});

test('POSITIVE: Validate data with automatic trim', t => {
    const cleanData = validator.validate({
        code: ' A ',
        password: ' 123  ',
        list: [' aaa ', ' bbb '],
        address: {
            street: '  hello '
        }
    });

    t.truthy(cleanData, 'should return clean data');

    t.deepEqual(
        cleanData,
        {
            code: 'A',
            password: '123',
            list: ['aaa', 'bbb'],
            address: {
                street: 'hello'
            }
        },
        'Should contain error codes'
    );
});
