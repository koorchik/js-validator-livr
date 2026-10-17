const test = require('ava');
const LIVR = require('../../lib/LIVR');

test('SECURITY: autoTrim should not allow prototype pollution bypass', t => {
    const validator = new LIVR.Validator({
        password: 'required',
        password_confirm: ['required', { equal_to_field: 'password' }]
    }, { autoTrim: true });

    // Attack: inject password via __proto__ to bypass equal_to_field check
    const attackData = JSON.parse('{"password_confirm": "hacked", "__proto__": {"password": "hacked"}}');

    const result = validator.validate(attackData);

    t.false(result, 'Validation should fail - password is required');
    t.deepEqual(validator.getErrors(), {
        password: 'REQUIRED',
        password_confirm: 'FIELDS_NOT_EQUAL'
    }, 'Should report both password required and fields not equal');
});

test('SECURITY: schema with __proto__ field should not cause errors', t => {
    const schema = JSON.parse('{"name": "required", "__proto__": "required"}');

    const validator = new LIVR.Validator(schema);

    t.notThrows(() => validator.prepare(), 'prepare() should not throw');
    t.notThrows(() => validator.validate({ name: 'test' }), 'validate() should not throw');

    const result = validator.validate({ name: 'test' });
    t.deepEqual(result, { name: 'test' }, 'Should return valid result');
});

test('SECURITY: __proto__ in input should be stripped from output', t => {
    const validator = new LIVR.Validator({
        name: 'required'
    }, { autoTrim: true });

    const input = JSON.parse('{"name": "test", "__proto__": {"malicious": true}}');
    const result = validator.validate(input);

    t.truthy(result, 'Validation should pass');
    t.deepEqual(Object.keys(result), ['name'], 'Result should only have name key');
    t.is(result.malicious, undefined, 'Malicious property should not be accessible');
    t.is(Object.getPrototypeOf(result), Object.prototype, 'Result prototype should be Object.prototype');
});

test('SECURITY: Object.prototype should not be polluted', t => {
    const testObj = {};
    t.is(testObj.polluted, undefined, 'Empty object should not have polluted property before test');

    const validator = new LIVR.Validator({
        name: 'required'
    }, { autoTrim: true });

    const input = JSON.parse('{"name": "test", "__proto__": {"polluted": "yes"}}');
    validator.validate(input);

    t.is(testObj.polluted, undefined, 'Object.prototype should not be polluted after validation');
    t.is(({}).polluted, undefined, 'New empty objects should not have polluted property');
});

test('SECURITY: input with own "hasOwnProperty" key should not crash validation', t => {
    const validator = new LIVR.Validator({ name: 'required', age: 'positive_integer' });

    const input = JSON.parse('{"name": "test", "hasOwnProperty": "x"}');

    t.deepEqual(validator.validate(input), { name: 'test' });
});

test('SECURITY: schema field named "hasOwnProperty" should work', t => {
    const validator = new LIVR.Validator({ hasOwnProperty: ['required', 'trim'], name: 'required' });

    t.deepEqual(validator.validate({ hasOwnProperty: ' x ', name: 'test' }), { hasOwnProperty: 'x', name: 'test' });
});
