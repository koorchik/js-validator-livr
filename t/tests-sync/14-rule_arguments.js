const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

// Paths the JSON test suite does not reach: rules with 3+ spread arguments, long one_of lists,
// and rules that push more than one output value
test('one_of accepts spread values of any count', () => {
    const validator = new LIVR.Validator({
        three: { one_of: ['a', 'b', 'c'] },
        four: { one_of: ['a', 'b', 'c', 'd'] },
        five: { one_of: ['a', 'b', 'c', 'd', 'e'] },
    });

    assert.deepEqual(validator.validate({ three: 'c', four: 'd', five: 'e' }), {
        three: 'c',
        four: 'd',
        five: 'e',
    });
    assert.equal(validator.validate({ three: 'x', four: 'x', five: 'x' }), false);
    assert.deepEqual(validator.getErrors(), {
        three: 'NOT_ALLOWED_VALUE',
        four: 'NOT_ALLOWED_VALUE',
        five: 'NOT_ALLOWED_VALUE',
    });
});

test('one_of with a long list works like with a short one', () => {
    const allowedValues = Array.from({ length: 40 }, (_, i) => i);
    allowedValues.push('1'); // a duplicate as a string: the first occurrence wins
    const validator = new LIVR.Validator({ value: { one_of: [allowedValues] } });

    assert.deepEqual(validator.validate({ value: '39' }), { value: 39 });
    assert.deepEqual(validator.validate({ value: 1 }), { value: 1 });
    assert.equal(validator.validate({ value: 40 }), false);
    assert.deepEqual(validator.getErrors(), { value: 'NOT_ALLOWED_VALUE' });
    assert.equal(validator.validate({ value: {} }), false);
    assert.deepEqual(validator.getErrors(), { value: 'FORMAT_ERROR' });
    assert.deepEqual(validator.validate({}), {});
});

test('The first output value of a rule is used, like before', () => {
    const validator = new LIVR.Validator({ a: ['my_two_outputs', 'to_uc'], b: 'required' });

    validator.registerRules({
        my_two_outputs: () => (value, params, outputArr) => {
            outputArr.push(value + '1', value + '2');
        },
    });

    assert.deepEqual(validator.validate({ a: 'x', b: 'y' }), { a: 'X1', b: 'y' });
    assert.deepEqual(validator.getFieldRule('a')('z', {}, []), undefined);
});
