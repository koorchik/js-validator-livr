import test from 'ava';
import LIVR from '../lib/LIVR';

function patchRule(ruleName, ruleBuilder) {
    return function() {
        const ruleValidator = ruleBuilder.apply(null, arguments);
        const ruleArgs = Array.prototype.splice.call(arguments, 0, arguments.length - 1 );

        return function() {
            const errorCode = ruleValidator.apply(null, arguments);

            if (errorCode) {
                const rule = {
                    [ruleName]: ruleArgs
                };

                return {
                    code: errorCode,
                    rule
                }
            }
        };
    }
}

test('Rules replacement: Validate data with registered rules', t => {
    // Patch rules
    const defaultRules = LIVR.Validator.getDefaultRules();

    const originalRules = {};
    const newRules      = {};

    for (const ruleName in defaultRules) {
        const ruleBuilder = defaultRules[ruleName];
        originalRules[ruleName] = ruleBuilder;
        newRules[ruleName] = patchRule(ruleName, ruleBuilder);
    }

    LIVR.Validator.registerDefaultRules(newRules);

    // Test
    const validator = new LIVR.Validator({
        name:  ['required'],
        phone: { max_length: 10 }
    });

    const output = validator.validate({
        phone: '123456789123456'
    });

    t.true(!output, 'Validation should fail');

    t.deepEqual( validator.getErrors(),
        {
            name: {
                code: 'REQUIRED',
                rule: { required: [] }
            },

            phone: {
                code: 'TOO_LONG',
                rule: { max_length: [10] }
            }
        }, 'Should return detailed errors' );

    // Restore
    LIVR.Validator.registerDefaultRules(originalRules);
});
