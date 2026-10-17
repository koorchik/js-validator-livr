const test = require('ava');
const querystring = require('querystring');
const LIVR = require('../../lib/LIVR');

// Cases the JSON test suite cannot express

const nullProto = props => Object.assign(Object.create(null), props);

test('util.isObject accepts plain objects only', t => {
    const { isObject } = LIVR.util;

    t.true(isObject({}));
    t.true(isObject({ constructor: 'value' }));
    t.true(isObject(Object.create(null)));
    t.true(isObject(Object.create({})));

    for (const value of [
        null,
        undefined,
        'str',
        1,
        [],
        new Date(),
        new Map(),
        new (class A {})(),
    ]) {
        t.false(isObject(value));
    }
});

test('Objects without prototype are validated as objects', t => {
    const productRules = ['type', { book: { type: 'required', title: 'required' } }];

    const validator = new LIVR.Validator({
        name: 'required',
        address: { nested_object: { city: 'required' } },
        meta: 'any_object',
        items: { list_of_objects: { id: 'positive_integer' } },
        product: { variable_object: productRules },
        products: { list_of_different_objects: productRules },
    });

    const output = validator.validate(
        nullProto({
            name: 'John',
            address: nullProto({ city: 'Kyiv' }),
            meta: nullProto({ key: 'value' }),
            items: [nullProto({ id: '1' })],
            product: nullProto({ type: 'book', title: 'LIVR' }),
            products: [nullProto({ type: 'book', title: 'LIVR' })],
        })
    );

    t.truthy(output, JSON.stringify(validator.getErrors()));
    t.deepEqual(
        { ...output, meta: { ...output.meta } },
        {
            name: 'John',
            address: { city: 'Kyiv' },
            meta: { key: 'value' },
            items: [{ id: 1 }],
            product: { type: 'book', title: 'LIVR' },
            products: [{ type: 'book', title: 'LIVR' }],
        }
    );
});

test('querystring.parse() output is validated and auto trimmed', t => {
    const validator = new LIVR.Validator(
        { name: 'required', age: 'positive_integer' },
        { autoTrim: true }
    );

    const output = validator.validate(querystring.parse('name=%20John%20&age=30&extra=1'));
    t.deepEqual(output, { name: 'John', age: 30 });
});

test('autoTrim trims objects with own "constructor" key', t => {
    const validator = new LIVR.Validator(
        { user: { nested_object: { constructor: 'required', name: 'required' } } },
        { autoTrim: true }
    );

    const output = validator.validate({ user: { constructor: ' value ', name: ' John ' } });
    t.deepEqual(output, { user: { constructor: 'value', name: 'John' } });
});

test('Class instances and arrays are not objects', t => {
    const validator = new LIVR.Validator({
        object: 'any_object',
        nested: { nested_object: { name: 'required' } },
    });

    for (const value of [[], new Date(), new Map(), new (class User {})()]) {
        t.false(validator.validate({ object: value, nested: value }));
        t.deepEqual(validator.getErrors(), { object: 'FORMAT_ERROR', nested: 'FORMAT_ERROR' });
    }
});
