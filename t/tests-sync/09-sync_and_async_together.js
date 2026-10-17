const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');
const AsyncLIVR = require('../../async');

// Sync and async entry points used to share one default rules registry,
// so the entry point loaded last replaced meta rules of the other one.

test('Sync validator keeps sync meta rules when async entry point is loaded', () => {
    const validator = new LIVR.Validator({
        user: { nested_object: { name: 'required' } },
        tags: { list_of: 'string' },
        pet: { or: [{ nested_object: { name: 'required' } }, 'string'] },
    });

    assert.deepEqual(
        validator.validate({ user: { name: 'John' }, tags: ['a'], pet: 'cat' }),
        { user: { name: 'John' }, tags: ['a'], pet: 'cat' }
    );

    assert.equal(validator.validate({ user: {}, tags: [{}] }), false);
    assert.deepEqual(validator.getErrors(), { user: { name: 'REQUIRED' }, tags: ['FORMAT_ERROR'] });
});

test('Async validator keeps async meta rules when sync entry point is loaded', async () => {
    AsyncLIVR.AsyncValidator.registerDefaultRules({
        is_free_name() {
            return async value => {
                await new Promise(resolve => setTimeout(resolve, 1));
                if (value === 'taken') return 'NAME_TAKEN';
            };
        },
    });

    const validator = new AsyncLIVR.AsyncValidator({
        users: { list_of_objects: { name: ['required', 'is_free_name'] } },
    });

    assert.deepEqual(await validator.validate({ users: [{ name: 'free' }] }), { users: [{ name: 'free' }] });

    const errors = await validator.validate({ users: [{ name: 'taken' }] }).catch(e => e);
    assert.deepEqual(errors, { users: [{ name: 'NAME_TAKEN' }] });
});

test('Custom default rules registered through one class work in the other', async () => {
    LIVR.Validator.registerDefaultRules({
        is_answer: () => value => (value === 42 ? undefined : 'NOT_ANSWER'),
    });
    AsyncLIVR.AsyncValidator.registerDefaultRules({
        is_question: () => value => (value === '?' ? undefined : 'NOT_QUESTION'),
    });

    const asyncValidator = new AsyncLIVR.AsyncValidator({ a: 'is_answer', b: 'isAnswer' });
    assert.deepEqual(await asyncValidator.validate({ a: 42, b: 42 }), { a: 42, b: 42 });

    const validator = new LIVR.Validator({ q: 'is_question' });
    assert.deepEqual(validator.validate({ q: '?' }), { q: '?' });
});

test('Default rule overridden through one class is overridden in the other', async () => {
    const strictEmail = () => value => (value.endsWith('.ua') ? undefined : 'NOT_UA_EMAIL');
    LIVR.Validator.registerDefaultRules({ email: strictEmail });

    try {
        const validator = new LIVR.Validator({ email: 'email' });
        assert.equal(validator.validate({ email: 'a@b.com' }), false);
        assert.deepEqual(validator.getErrors(), { email: 'NOT_UA_EMAIL' });

        const asyncValidator = new AsyncLIVR.AsyncValidator({ email: 'email' });
        const errors = await asyncValidator.validate({ email: 'a@b.com' }).catch(e => e);
        assert.deepEqual(errors, { email: 'NOT_UA_EMAIL' });
    } finally {
        LIVR.Validator.registerDefaultRules({ email: LIVR.rules.email });
    }
});

test('getDefaultRules() returns rules of the validator family', () => {
    assert.equal(LIVR.Validator.getDefaultRules().nested_object, LIVR.rules.nested_object);
    assert.equal(AsyncLIVR.AsyncValidator.getDefaultRules().nested_object, AsyncLIVR.rules.nested_object);
});
