const test = require('ava');
const LIVR = require('../../async');

test('Keeps order of result and errors keys for synchronous rules', async t => {
    const validator = new LIVR.AsyncValidator({
        a: ['required', 'email'],
        b: 'required',
        c: ['trim', { default: 'x' }],
        d: 'trim',
    });

    const errors = await validator.validate({ a: 'bad', d: ' d ' }).catch(e => e);
    t.deepEqual(Object.keys(errors), ['b', 'a']);

    const output = await validator.validate({ a: 'a@b.com', b: 1, d: ' d ' });
    t.deepEqual(Object.keys(output), ['a', 'b', 'd', 'c']);
});

test('Awaits promises and thenables returned by rules', async t => {
    const validator = new LIVR.AsyncValidator({
        a: ['my_promise', 'my_thenable', 'to_uc'],
        b: ['my_thenable', 'required'],
    });

    validator.registerRules({
        my_promise: () => (value, all, outputArr) =>
            new Promise(resolve => setTimeout(() => (outputArr.push(value + '1'), resolve()), 1)),
        my_thenable: () => (value, all, outputArr) => ({
            then(resolve) {
                if (value === undefined) return resolve();
                if (value.startsWith('bad')) return resolve('BAD');

                outputArr.push(value + '2');
                resolve();
            },
        }),
    });

    t.deepEqual(await validator.validate({ a: 'x', b: 'y' }), { a: 'X12', b: 'y2' });
    t.deepEqual(await validator.validate({ a: 'bad' }).catch(e => e), { a: 'BAD', b: 'REQUIRED' });
});

test('Rejects with exception thrown by a rule', async t => {
    const validator = new LIVR.AsyncValidator({ a: 'required', b: 'my_throw' });

    validator.registerRules({
        my_throw: () => () => {
            throw new Error('Boom');
        },
    });

    await t.throwsAsync(validator.validate({ a: 1, b: 2 }), { message: 'Boom' });
});

test('Exception of a rule leaves no unhandled rejections of fields validated asynchronously', async t => {
    const validator = new LIVR.AsyncValidator({ a: 'my_reject_later', b: 'my_throw' });

    validator.registerRules({
        my_reject_later: () => () =>
            new Promise((resolve, reject) => setTimeout(() => reject(new Error('Later')), 10)),
        my_throw: () => () => {
            throw new Error('Boom');
        },
    });

    const unhandledRejections = [];
    const onUnhandledRejection = error => unhandledRejections.push(error.message);
    process.on('unhandledRejection', onUnhandledRejection);

    try {
        await t.throwsAsync(validator.validate({ a: 1, b: 2 }), { message: 'Boom' });
        // The rule of "a" rejects after validate() has rejected
        await new Promise(resolve => setTimeout(resolve, 50));
    } finally {
        process.off('unhandledRejection', onUnhandledRejection);
    }

    t.deepEqual(unhandledRejections, []);
});

test('Meta rules and aliases wait for asynchronous rules of nested schemas', async t => {
    const nestedRules = { type: 'required', value: 'my_async_uc' };
    const validator = new LIVR.AsyncValidator({
        nested: { nested_object: { value: 'my_async_uc' } },
        list: { list_of: 'my_async_uc' },
        objects: { list_of_objects: { value: 'my_async_uc' } },
        variable: { variable_object: ['type', { a: nestedRules }] },
        different: { list_of_different_objects: ['type', { a: nestedRules }] },
        either: { or: [{ eq: 'never' }, 'my_async_uc'] },
        aliased: 'my_alias',
    });

    validator.registerRules({
        my_async_uc: () => async (value, all, outputArr) => {
            if (value === 'bad') return 'BAD';
            outputArr.push(value.toUpperCase());
        },
    });
    validator.registerAliasedRule({ name: 'my_alias', rules: 'my_async_uc' });

    const output = await validator.validate({
        nested: { value: 'a' },
        list: ['a', 'b'],
        objects: [{ value: 'a' }],
        variable: { type: 'a', value: 'a' },
        different: [{ type: 'a', value: 'a' }],
        either: 'a',
        aliased: 'a',
    });

    t.deepEqual(output, {
        nested: { value: 'A' },
        list: ['A', 'B'],
        objects: [{ value: 'A' }],
        variable: { type: 'a', value: 'A' },
        different: [{ type: 'a', value: 'A' }],
        either: 'A',
        aliased: 'A',
    });

    const errors = await validator
        .validate({
            nested: { value: 'bad' },
            list: ['a', 'bad'],
            objects: [{ value: 'bad' }],
            variable: { type: 'a', value: 'bad' },
            different: [{ type: 'a', value: 'bad' }],
            either: 'bad',
            aliased: 'bad',
        })
        .catch(e => e);

    t.deepEqual(errors, {
        nested: { value: 'BAD' },
        list: [null, 'BAD'],
        objects: [{ value: 'BAD' }],
        variable: { value: 'BAD' },
        different: [{ value: 'BAD' }],
        either: 'BAD',
        aliased: 'BAD',
    });
});

test('Meta rules return exceptions of nested rules as errors', async t => {
    const validator = new LIVR.AsyncValidator({
        items: { list_of_objects: { a: 'my_throw' } },
        values: { list_of: 'my_async_throw' },
        object: { nested_object: { a: 'my_throw' } },
    });

    const boom = new Error('Boom');
    validator.registerRules({
        my_throw: () => () => {
            throw boom;
        },
        my_async_throw: () => async () => {
            throw { field: 'ASYNC_BOOM' };
        },
    });

    const errors = await validator.validate({ items: [{ a: 1 }], values: [1], object: { a: 1 } })
        .catch(e => e);

    t.deepEqual(errors, { items: [boom], values: ['ASYNC_BOOM'], object: boom });
});

test('Subclass can override validateField()', async t => {
    class LoggingValidator extends LIVR.AsyncValidator {
        validateField(fieldName, ...args) {
            this.fieldNames.push(fieldName);
            return super.validateField(fieldName, ...args);
        }
    }

    const validator = new LoggingValidator({ a: 'required', b: ['trim', { max_length: 2 }] });
    validator.fieldNames = [];

    t.deepEqual(await validator.validate({ a: 1, b: ' xy ' }), { a: 1, b: 'xy' });
    t.deepEqual(validator.fieldNames, ['a', 'b']);
});
