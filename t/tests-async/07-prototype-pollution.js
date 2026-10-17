const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../async');

test('SECURITY: autoTrim should not allow prototype pollution bypass', async () => {
    const validator = new LIVR.AsyncValidator({
        password: 'required',
        password_confirm: ['required', { equal_to_field: 'password' }]
    }, { autoTrim: true });

    // Attack: inject password via __proto__ to bypass equal_to_field check
    const attackData = JSON.parse('{"password_confirm": "hacked", "__proto__": {"password": "hacked"}}');

    try {
        await validator.validate(attackData);
        assert.fail('Validation should have thrown an error');
    } catch (errors) {
        assert.deepEqual(errors, {
            password: 'REQUIRED',
            password_confirm: 'FIELDS_NOT_EQUAL'
        }, 'Should report both password required and fields not equal');
    }
});

test('SECURITY: schema with __proto__ field should not cause errors', async () => {
    const schema = JSON.parse('{"name": "required", "__proto__": "required"}');

    const validator = new LIVR.AsyncValidator(schema);

    await assert.doesNotReject(async () => {
        validator.prepare();
    }, 'prepare() should not throw');

    const result = await validator.validate({ name: 'test' });
    assert.deepEqual(result, { name: 'test' }, 'Should return valid result');
});

test('SECURITY: __proto__ in input should be stripped from output', async () => {
    const validator = new LIVR.AsyncValidator({
        name: 'required'
    }, { autoTrim: true });

    const input = JSON.parse('{"name": "test", "__proto__": {"malicious": true}}');
    const result = await validator.validate(input);

    assert.ok(result, 'Validation should pass');
    assert.deepEqual(Object.keys(result), ['name'], 'Result should only have name key');
    assert.equal(result.malicious, undefined, 'Malicious property should not be accessible');
    assert.equal(Object.getPrototypeOf(result), Object.prototype, 'Result prototype should be Object.prototype');
});

test('SECURITY: Object.prototype should not be polluted', async () => {
    const testObj = {};
    assert.equal(testObj.polluted, undefined, 'Empty object should not have polluted property before test');

    const validator = new LIVR.AsyncValidator({
        name: 'required'
    }, { autoTrim: true });

    const input = JSON.parse('{"name": "test", "__proto__": {"polluted": "yes"}}');
    await validator.validate(input);

    assert.equal(testObj.polluted, undefined, 'Object.prototype should not be polluted after validation');
    assert.equal(({}).polluted, undefined, 'New empty objects should not have polluted property');
});

test('SECURITY: input with own "hasOwnProperty" key should not crash validation', async () => {
    const validator = new LIVR.AsyncValidator({ name: 'required', age: 'positive_integer' });

    const input = JSON.parse('{"name": "test", "hasOwnProperty": "x"}');

    assert.deepEqual(await validator.validate(input), { name: 'test' });
});

test('SECURITY: schema field named "hasOwnProperty" should work', async () => {
    const validator = new LIVR.AsyncValidator({ hasOwnProperty: ['required', 'trim'], name: 'required' });

    assert.deepEqual(
        await validator.validate({ hasOwnProperty: ' x ', name: 'test' }),
        { hasOwnProperty: 'x', name: 'test' }
    );
});
