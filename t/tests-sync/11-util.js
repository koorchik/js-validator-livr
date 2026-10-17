const test = require('ava');
const LIVR = require('../../lib/LIVR');

test('util.isThenable accepts promises and objects with then() method', t => {
    const { isThenable } = LIVR.util;

    t.true(isThenable(Promise.resolve()));
    t.true(isThenable({ then() {} }));
    t.true(isThenable(Object.assign(() => {}, { then() {} })));

    for (const value of [undefined, null, '', 'REQUIRED', 0, {}, [], { then: 'value' }]) {
        t.false(isThenable(value));
    }
});

test('util.getFieldValue does not take inherited methods as values', t => {
    const { getFieldValue } = LIVR.util;
    const method = () => {};

    t.is(getFieldValue({ a: 1 }, 'a'), 1);
    t.is(getFieldValue({}, 'a'), undefined);
    t.is(getFieldValue({}, 'constructor'), undefined);
    t.is(getFieldValue({}, 'toString'), undefined);
    t.is(getFieldValue({ constructor: 'value' }, 'constructor'), 'value');
    t.is(getFieldValue({ toString: method }, 'toString'), method);
    t.is(getFieldValue(Object.create(null), 'toString'), undefined);
});
