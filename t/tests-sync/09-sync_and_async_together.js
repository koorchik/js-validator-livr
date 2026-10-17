const test = require('ava');
const LIVR = require('../../lib/LIVR');
const AsyncLIVR = require('../../async');

// Sync and async entry points used to share one default rules registry,
// so the entry point loaded last replaced meta rules of the other one.

test('Sync validator keeps sync meta rules when async entry point is loaded', t => {
    const validator = new LIVR.Validator({
        user: { nested_object: { name: 'required' } },
        tags: { list_of: 'string' },
        pet: { or: [{ nested_object: { name: 'required' } }, 'string'] },
    });

    t.deepEqual(
        validator.validate({ user: { name: 'John' }, tags: ['a'], pet: 'cat' }),
        { user: { name: 'John' }, tags: ['a'], pet: 'cat' }
    );

    t.false(validator.validate({ user: {}, tags: [{}] }));
    t.deepEqual(validator.getErrors(), { user: { name: 'REQUIRED' }, tags: ['FORMAT_ERROR'] });
});

test('Async validator keeps async meta rules when sync entry point is loaded', async t => {
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

    t.deepEqual(await validator.validate({ users: [{ name: 'free' }] }), { users: [{ name: 'free' }] });

    const errors = await validator.validate({ users: [{ name: 'taken' }] }).catch(e => e);
    t.deepEqual(errors, { users: [{ name: 'NAME_TAKEN' }] });
});

test('Custom default rules registered through one class work in the other', async t => {
    LIVR.Validator.registerDefaultRules({
        is_answer: () => value => (value === 42 ? undefined : 'NOT_ANSWER'),
    });
    AsyncLIVR.AsyncValidator.registerDefaultRules({
        is_question: () => value => (value === '?' ? undefined : 'NOT_QUESTION'),
    });

    const asyncValidator = new AsyncLIVR.AsyncValidator({ a: 'is_answer', b: 'isAnswer' });
    t.deepEqual(await asyncValidator.validate({ a: 42, b: 42 }), { a: 42, b: 42 });

    const validator = new LIVR.Validator({ q: 'is_question' });
    t.deepEqual(validator.validate({ q: '?' }), { q: '?' });
});

test('getDefaultRules() returns rules of the validator family', t => {
    t.is(LIVR.Validator.getDefaultRules().nested_object, LIVR.rules.nested_object);
    t.is(AsyncLIVR.AsyncValidator.getDefaultRules().nested_object, AsyncLIVR.rules.nested_object);
});
