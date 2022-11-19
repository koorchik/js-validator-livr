const test = require('ava');
const LIVR = require('../../async');

const validator = new LIVR.AsyncValidator(
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


test('NEGATIVE: Validate data with automatic trim', async (t) => {
    try {
        const output = await validator.validate({
            code: '  ',
            password: ' 12  ',
            address: {
                street: '  hell '
            }
        });    
    } catch (errors) {
        t.deepEqual(
            errors,
            {
                code: 'REQUIRED',
                password: 'TOO_SHORT',
                address: {
                    street: 'TOO_SHORT'
                }
            },
            'Should contain error codes'
        );    
    }
});

test('POSITIVE: Validate data with automatic trim', async (t) => {
    const cleanData = await validator.validate({
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
