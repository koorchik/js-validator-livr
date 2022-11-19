const test = require('ava');
const LIVR = require('../../async');

function patchRule(ruleName, ruleBuilder) {
    return function(...params) {
        const ruleValidator = ruleBuilder(...params);
        const ruleArgs = params.splice(0, params.length - 1);

        return (...params) => {
            const errorCode = ruleValidator(...params);

            if (errorCode) {
                const rule = {
                    [ruleName]: ruleArgs
                };

                return {
                    code: errorCode,
                    rule
                };
            }
        };
    };
}

test('Rules replacement: Validate data with registered rules', async (t) => {
    // Patch rules
    const defaultRules = LIVR.AsyncValidator.getDefaultRules();

    const originalRules = {};
    const newRules = {};

    for (const ruleName in defaultRules) {
        const ruleBuilder = defaultRules[ruleName];
        originalRules[ruleName] = ruleBuilder;
        newRules[ruleName] = patchRule(ruleName, ruleBuilder);
    }

    LIVR.AsyncValidator.registerDefaultRules(newRules);

    // Test
    const validator = new LIVR.AsyncValidator({
        name: ['required'],
        phone: { max_length: 10 }
    });

    try {
        const output = await validator.validate({
            phone: '123456789123456'
        });    
    } catch (errors) {
        t.deepEqual(
            errors,
            {
                name: {
                    code: 'REQUIRED',
                    rule: { required: [] }
                },
    
                phone: {
                    code: 'TOO_LONG',
                    rule: { max_length: [10] }
                }
            },
            'Should return detailed errors'
        );
    }
    
    // Restore
    LIVR.AsyncValidator.registerDefaultRules(originalRules);
});
