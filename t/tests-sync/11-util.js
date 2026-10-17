const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

test('util.isThenable accepts promises and objects with then() method', () => {
    const { isThenable } = LIVR.util;

    assert.equal(isThenable(Promise.resolve()), true);
    assert.equal(isThenable({ then() {} }), true);
    assert.equal(isThenable(Object.assign(() => {}, { then() {} })), true);

    for (const value of [undefined, null, '', 'REQUIRED', 0, {}, [], { then: 'value' }]) {
        assert.equal(isThenable(value), false);
    }
});

test('util.getFieldValue does not take inherited methods as values', () => {
    const { getFieldValue } = LIVR.util;
    const method = () => {};

    assert.equal(getFieldValue({ a: 1 }, 'a'), 1);
    assert.equal(getFieldValue({}, 'a'), undefined);
    assert.equal(getFieldValue({}, 'constructor'), undefined);
    assert.equal(getFieldValue({}, 'toString'), undefined);
    assert.equal(getFieldValue({ constructor: 'value' }, 'constructor'), 'value');
    assert.equal(getFieldValue({ toString: method }, 'toString'), method);
    assert.equal(getFieldValue(Object.create(null), 'toString'), undefined);
});
