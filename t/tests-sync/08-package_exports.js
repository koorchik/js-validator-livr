const test = require('ava');

// Package self-reference resolves through the "exports" field of package.json,
// the same way it is resolved for users of the published package.
test('Documented entry points are exported', t => {
    t.is(typeof require('livr').Validator, 'function');
    t.is(typeof require('livr/async').AsyncValidator, 'function');
    t.is(typeof require('livr/async.js').AsyncValidator, 'function');
    t.is(typeof require('livr/lib/Validator'), 'function');
    t.is(typeof require('livr/lib/Validator.js'), 'function');
    t.is(typeof require('livr/lib/rules/common/required'), 'function');
    t.is(typeof require('livr/lib/rules/special/email.js'), 'function');
    t.is(require('livr/package.json').name, 'livr');
});

test('Documented ESM entry points are exported', async t => {
    t.is(typeof (await import('livr')).default.Validator, 'function');
    t.is(typeof (await import('livr/async')).default.AsyncValidator, 'function');
    t.is(typeof (await import('livr/lib/Validator')).default, 'function');
});

test('Tree-shaking setup from README works', t => {
    const Validator = require('livr/lib/Validator');

    Validator.registerDefaultRules({
        required: require('livr/lib/rules/common/required'),
        email: require('livr/lib/rules/special/email'),
    });

    const validator = new Validator({ email: ['required', 'email'] });

    t.deepEqual(validator.validate({ email: 'user@example.com' }), { email: 'user@example.com' });
});
