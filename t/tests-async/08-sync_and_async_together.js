const test = require('ava');
// Load order matters for this test: async entry point first, then sync one
const AsyncLIVR = require('../../async');
const LIVR = require('../../lib/LIVR');

test('Async validator keeps async meta rules when sync entry point is loaded after it', async t => {
    AsyncLIVR.AsyncValidator.registerDefaultRules({
        is_free_name() {
            return async value => {
                await new Promise(resolve => setTimeout(resolve, 1));
                if (value === 'taken') return 'NAME_TAKEN';
            };
        },
    });

    const validator = new AsyncLIVR.AsyncValidator({
        user: { nested_object: { name: ['required', 'is_free_name'] } },
        names: { list_of: ['required', 'is_free_name'] },
    });

    t.deepEqual(
        await validator.validate({ user: { name: 'free' }, names: ['a', 'b'] }),
        { user: { name: 'free' }, names: ['a', 'b'] }
    );

    const errors = await validator.validate({ user: { name: 'taken' }, names: ['a', 'taken'] }).catch(e => e);
    t.deepEqual(errors, { user: { name: 'NAME_TAKEN' }, names: [null, 'NAME_TAKEN'] });
});

test('Sync validator keeps sync meta rules when it is loaded after async entry point', t => {
    const validator = new LIVR.Validator({ user: { nested_object: { name: 'required' } } });

    t.deepEqual(validator.validate({ user: { name: 'John' } }), { user: { name: 'John' } });
});
