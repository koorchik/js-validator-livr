const test = require('ava');
const LIVR = require('../../async');

test('SECURITY: autoTrim should not allow prototype pollution bypass', async t => {
    const validator = new LIVR.AsyncValidator({
        password: 'required',
        password_confirm: ['required', { equal_to_field: 'password' }]
    }, { autoTrim: true });

    // Attack: inject password via __proto__ to bypass equal_to_field check
    const attackData = JSON.parse('{"password_confirm": "hacked", "__proto__": {"password": "hacked"}}');

    try {
        await validator.validate(attackData);
        t.fail('Validation should have thrown an error');
    } catch (errors) {
        t.deepEqual(errors, {
            password: 'REQUIRED',
            password_confirm: 'FIELDS_NOT_EQUAL'
        }, 'Should report both password required and fields not equal');
    }
});

test('SECURITY: schema with __proto__ field should not cause errors', async t => {
    const schema = JSON.parse('{"name": "required", "__proto__": "required"}');

    const validator = new LIVR.AsyncValidator(schema);

    await t.notThrowsAsync(async () => {
        validator.prepare();
    }, 'prepare() should not throw');

    const result = await validator.validate({ name: 'test' });
    t.deepEqual(result, { name: 'test' }, 'Should return valid result');
});

test('SECURITY: __proto__ in input should be stripped from output', async t => {
    const validator = new LIVR.AsyncValidator({
        name: 'required'
    }, { autoTrim: true });

    const input = JSON.parse('{"name": "test", "__proto__": {"malicious": true}}');
    const result = await validator.validate(input);

    t.truthy(result, 'Validation should pass');
    t.deepEqual(Object.keys(result), ['name'], 'Result should only have name key');
    t.is(result.malicious, undefined, 'Malicious property should not be accessible');
    t.is(Object.getPrototypeOf(result), Object.prototype, 'Result prototype should be Object.prototype');
});

test('SECURITY: Object.prototype should not be polluted', async t => {
    const testObj = {};
    t.is(testObj.polluted, undefined, 'Empty object should not have polluted property before test');

    const validator = new LIVR.AsyncValidator({
        name: 'required'
    }, { autoTrim: true });

    const input = JSON.parse('{"name": "test", "__proto__": {"polluted": "yes"}}');
    await validator.validate(input);

    t.is(testObj.polluted, undefined, 'Object.prototype should not be polluted after validation');
    t.is(({}).polluted, undefined, 'New empty objects should not have polluted property');
});
