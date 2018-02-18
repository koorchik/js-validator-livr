# LIVR Validator

LIVR.Validator - Lightweight JavaScript validator supporting Language Independent Validation Rules Specification (LIVR).

[![npm version](https://badge.fury.io/js/livr.svg)](https://badge.fury.io/js/livr)
[![Build Status](https://travis-ci.org/koorchik/js-validator-livr.svg?branch=master)](https://travis-ci.org/koorchik/js-validator-livr)
[![Known Vulnerabilities](https://snyk.io/test/github/koorchik/js-validator-livr/badge.svg?targetFile=package.json)](https://snyk.io/test/github/koorchik/js-validator-livr?targetFile=package.json)
[![NSP Status](https://nodesecurity.io/orgs/webbylab/projects/6a31d849-bd09-4414-8bd2-5247b9b033eb/badge)](https://nodesecurity.io/orgs/webbylab/projects/6a31d849-bd09-4414-8bd2-5247b9b033eb)

# SYNOPSIS
Common usage:

```javascript
var LIVR = require('livr');
LIVR.Validator.defaultAutoTrim(true);

var validator = new LIVR.Validator({
    name:      'required',
    email:     [ 'required', 'email' ],
    gender:    { one_of : ['male', 'female'] },
    phone:     { max_length : 10 },
    password:  [ 'required', {min_length : 10} ],
    password2: { equal_to_field : 'password' }
});

var validData = validator.validate(userData);

if (validData) {
    saveUser(validData);
} else {
    console.log('errors', validator.getErrors());
}
```


You can use modifiers separately or can combine them with validation:

```javascript
var validator = new LIVR.Validator({
    email: [ 'required', 'trim', 'email', 'to_lc' ]
});
```


Feel free to register your own rules:

You can use aliases(preferable, syntax covered by the specification) for a lot of cases:

```javascript
var validator = new LIVR.Validator({
    password: ['required', 'strong_password']
});

validator.registerAliasedRule({
    name: 'strong_password',
    rules: {min_length: 6},
    error: 'WEAK_PASSWORD'
});
```

Or you can write more sophisticated rules directly:

```javascript
var validator = new LIVR.Validator({
    password: ['required', 'strong_password']
});

validator.registerRules({ strong_password: function() {
    return function(value) {
        // We already have "required" rule to check that the value is present
        if ( value === undefined || value === null || value === '' ) return;

        if ( value.length < 6 ) {
            return 'WEAK_PASSWORD'
        }
    }
}});
```

# DESCRIPTION
See [LIVR Specification](http://livr-spec.org) for detailed documentation and list of supported rules.

Features:

 * Rules are declarative and language independent
 * Any number of rules for each field
 * Return together errors for all fields
 * Excludes all fields that do not have validation rules described
 * Has possibility to validate complex hierarchical structures
 * Easy to describe and understand rules
 * Returns understandable error codes(not error messages)
 * Easy to add own rules
 * Rules are be able to change results output ("trim", "nested\_object", for example)
 * Multipurpose (user input validation, configs validation, contracts programming etc)

__You can find more rules in [livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules)__

# INSTALL

#### nodejs/npm

```bash
npm install livr
```

#### Browser

You can find browserified versions in "dist" folder (livr-debug.js - not minified development version with source maps, livr-min.js - minified production version). Possible you will need some polyfills ("isInteger" etc) for older browsers.  

# CLASS METHODS

## new LIVR.Validator(livr, isAutoTrim);
Constructor creates validator objects.
livr - validations rules. Rules description is available here - https://github.com/koorchik/LIVR

isAutoTrim - asks validator to trim all values before validation. Output will be also trimmed.
if isAutoTrim is undefined(or null) than defaultAutoTrim value will be used.

## LIVR.Validator.registerAliasedDefaultRule(alias)
alias - is a plain javascript object that contains: name, rules, error (optional).

```javascript
LIVR.Validator.registerAliasedDefaultRule({
    name: 'valid_address',
    rules: { nested_object: {
        country: 'required',
        city: 'required',
        zip: 'positive_integer'
    }}
});
```

Then you can use "valid\_address" for validation:

```javascript
{
    address: 'valid_address'
}
```

You can register aliases with own errors:

```javascript
LIVR.Validator.registerAliasedDefaultRule({
    name: 'adult_age'
    rules: [ 'positive_integer', { min_number: 18 } ],
    error: 'WRONG_AGE'
});
```

All rules/aliases for the validator are equal. The validator does not distinguish "required", "list\_of\_different\_objects" and "trim" rules. So, you can extend validator with any rules/alias you like.

## LIVR.Validator.registerDefaultRules({"rule\_name": ruleBuilder })
ruleBuilder - is a function reference which will be called for building single rule validator.

```javascript
LIVR.Validator.registerDefaultRules({ my_rule: function(arg1, arg2, arg3, ruleBuilders) {
    // ruleBuilders - are rules from original validator
    // to allow you create new validator with all supported rules
    // var validator = new LIVR.Validator(livr).registerRules(ruleBuilders).prepare();

    return function(value, allValues, outputArr) {
        if (notValid) {
            return "SOME_ERROR_CODE";
        }
        else {

        }
    }
}});
```

Then you can use "my\_rule" for validation:

```javascript
{
    name1: 'my_rule' // Call without parameters
    name2: { 'my_rule': arg1 } // Call with one parameter.
    name3: { 'my_rule': [arg1] } // Call with one parameter.
    name4: { 'my_rule': [ arg1, arg2, arg3 ] } // Call with many parameters.
}
```

Here is "max\_number" implemenation:

```javascript
function maxNumber(maxNumber) {
    return function(value) {
        // We do not validate empty fields. We have "required" rule for this purpose
        if (value === undefined || value === null || value === '' ) return;

        // return error message
        if ( value > maxNumber ) return 'TOO_HIGH';
    };
};
LIVR.Validator.registerDefaultRules({ "max_number": maxNumber });
```

All rules for the validator are equal. The validator does not distinguish "required", "list\_of\_different\_objects" and "trim" rules. So, you can extend validator with any rules you like.

## LIVR.Validator.getDefaultRules();
returns object containing all default ruleBuilders for the validator. You can register new rule or update existing one with "registerRules" method.

## LIVR.Validator.defaultAutoTrim(isAutoTrim)
Enables or disables automatic trim for input data. If is on then every new validator instance will have auto trim option enabled

## LIVR.util

List of useful utils for writing your rules (see source code)

# OBJECT METHODS

## validator.validate(input)
Validates user input. On success returns validData (contains only data that has described validation rules). On error return false.

```javascript
var validData = validator.validate(input)

if (validData) {
    // use validData
} else {
    var errors = validator.getErrors();
}
```

## validator.getErrors()
Returns errors object.

```javascript
{
    "field1": "ERROR_CODE",
    "field2": "ERROR_CODE",
    ...
}
```

For example:

```javascript
{
    "country":  "NOT_ALLOWED_VALUE",
    "zip":      "NOT_POSITIVE_INTEGER",
    "street":   "REQUIRED",
    "building": "NOT_POSITIVE_INTEGER"
}
```

## validator.registerRules({"rule_name": ruleBuilder})

ruleBuilder - is a function reference which will be called for building single rule validator.

See "LIVR.Validator.registerDefaultRules" for rules examples.

## validator.registerAliasedRule(alias)

alias - is a composite validation rule.

See "LIVR.Validator.registerAliasedDefaultRule" for rules examples.

## validator.getRules()
returns object containing all ruleBuilders for the validator. You can register new rule or update existing one with "registerRules" method.

# AUTHOR
koorchik (Viktor Turskyi)

# BUGS
Please report any bugs or feature requests to Github https://github.com/koorchik/js-validator-livr

