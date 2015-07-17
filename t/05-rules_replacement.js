'use strict';
var LIVR = require('../lib/LIVR');

function patchRule(ruleName, ruleBuilder) {
    return function() {
        var ruleValidator = ruleBuilder.apply(null, arguments);
        var ruleArgs = Array.prototype.splice.call(arguments, 0, arguments.length - 1 );

        return function() {
            var errorCode = ruleValidator.apply(null, arguments);

            if (errorCode) {
                var rule = {};
                rule[ruleName] = ruleArgs;

                return {
                    code: errorCode,
                    rule: rule
                }
            }
        };
    }
}

var defaultRules = LIVR.Validator.getDefaultRules();
var newRules = {};

for (var ruleName in defaultRules) {
    var ruleBuilder = defaultRules[ruleName];
    newRules[ruleName] = patchRule(ruleName, ruleBuilder);
}

LIVR.Validator.registerDefaultRules(newRules);

var validData = validator.validate({
    phone: '123456789123456'
});

test('Validate data with registered rules', function() {
    var validator = new LIVR.Validator({
        name:  ['required'],
        phone: { max_length: 10 }
    });


    var output = validator.validate({
        phone: '123456789123456'
    });

    ok(!output, 'Validation should fail');

    deepEqual( validator.getErrors(),
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
});