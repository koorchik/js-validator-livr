const test = require('node:test');
const assert = require('node:assert/strict');
const querystring = require('querystring');
const LIVR = require('../../async');

// Cases the JSON test suite cannot express

const nullProto = props => Object.assign(Object.create(null), props);

test('Objects without prototype are validated as objects', async () => {
    const productRules = ['type', { book: { type: 'required', title: 'required' } }];

    const validator = new LIVR.AsyncValidator({
        name: 'required',
        address: { nested_object: { city: 'required' } },
        meta: 'any_object',
        items: { list_of_objects: { id: 'positive_integer' } },
        product: { variable_object: productRules },
        products: { list_of_different_objects: productRules },
    });

    const output = await validator.validate(
        nullProto({
            name: 'John',
            address: nullProto({ city: 'Kyiv' }),
            meta: nullProto({ key: 'value' }),
            items: [nullProto({ id: '1' })],
            product: nullProto({ type: 'book', title: 'LIVR' }),
            products: [nullProto({ type: 'book', title: 'LIVR' })],
        })
    );

    assert.deepEqual(
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

test('querystring.parse() output is validated and auto trimmed', async () => {
    const validator = new LIVR.AsyncValidator(
        { name: 'required', age: 'positive_integer' },
        { autoTrim: true }
    );

    const output = await validator.validate(querystring.parse('name=%20John%20&age=30&extra=1'));
    assert.deepEqual(output, { name: 'John', age: 30 });
});

test('autoTrim trims objects with own "constructor" key', async () => {
    const validator = new LIVR.AsyncValidator(
        { user: { nested_object: { constructor: 'required', name: 'required' } } },
        { autoTrim: true }
    );

    const output = await validator.validate({ user: { constructor: ' value ', name: ' John ' } });
    assert.deepEqual(output, { user: { constructor: 'value', name: 'John' } });
});

test('Class instances and arrays are not objects', async () => {
    const validator = new LIVR.AsyncValidator({
        object: 'any_object',
        nested: { nested_object: { name: 'required' } },
    });

    for (const value of [[], new Date(), new Map(), new (class User {})()]) {
        const errors = await validator.validate({ object: value, nested: value }).catch(e => e);
        assert.deepEqual(errors, { object: 'FORMAT_ERROR', nested: 'FORMAT_ERROR' });
    }
});

test('Validators filled or changed by a subclass are used', async () => {
    class ExtraField extends LIVR.AsyncValidator {
        prepare() {
            super.prepare();
            this.validators.extra = [() => 'EXTRA_ERR'];
            return this;
        }
    }

    const errors = await new ExtraField({ name: 'required' }).validate({ name: 'x' }).catch(e => e);
    assert.deepEqual(errors, { extra: 'EXTRA_ERR' });
});
