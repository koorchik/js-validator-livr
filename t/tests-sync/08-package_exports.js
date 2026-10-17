const test = require('node:test');
const assert = require('node:assert/strict');

// Package self-reference resolves through the "exports" field of package.json,
// the same way it is resolved for users of the published package.
test('Documented entry points are exported', () => {
    assert.equal(typeof require('livr').Validator, 'function');
    assert.equal(typeof require('livr/async').AsyncValidator, 'function');
    assert.equal(typeof require('livr/async.js').AsyncValidator, 'function');
    assert.equal(typeof require('livr/lib/Validator'), 'function');
    assert.equal(typeof require('livr/lib/Validator.js'), 'function');
    assert.equal(typeof require('livr/lib/rules/common/required'), 'function');
    assert.equal(typeof require('livr/lib/rules/special/email.js'), 'function');
    assert.equal(require('livr/package.json').name, 'livr');
});

test('Documented ESM entry points are exported', async () => {
    assert.equal(typeof (await import('livr')).default.Validator, 'function');
    assert.equal(typeof (await import('livr/async')).default.AsyncValidator, 'function');
    assert.equal(typeof (await import('livr/lib/Validator')).default, 'function');
});

test('Tree-shaking setup from README works', () => {
    const Validator = require('livr/lib/Validator');

    Validator.registerDefaultRules({
        required: require('livr/lib/rules/common/required'),
        email: require('livr/lib/rules/special/email'),
    });

    const validator = new Validator({ email: ['required', 'email'] });

    assert.deepEqual(validator.validate({ email: 'user@example.com' }), { email: 'user@example.com' });
});
