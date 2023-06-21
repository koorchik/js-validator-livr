# LIVR Validator

LIVR.Validator - Lightweight JavaScript validator supporting Language Independent Validation Rules Specification (LIVR).

[![npm version](https://badge.fury.io/js/livr.svg)](https://badge.fury.io/js/livr)
[![Known Vulnerabilities](https://snyk.io/test/github/koorchik/js-validator-livr/badge.svg?targetFile=package.json)](https://snyk.io/test/github/koorchik/js-validator-livr?targetFile=package.json)

# SYNOPSIS

There are 2 implementations:

1. "Validator" supports only synchronous rules. All built-in rules are synchronous.
2. "AsyncValidator" (_experimental_) supports both synchronous and asynchronous rules.

Common usage:

```javascript
import LIVR from 'livr';
LIVR.Validator.defaultAutoTrim(true);

const validator = new LIVR.Validator({
    name: 'required',
    email: ['required', 'email'],
    gender: { one_of: ['male', 'female'] },
    phone: { max_length: 10 },
    password: ['required', { min_length: 10 }],
    password2: { equal_to_field: 'password' }
});

const validData = validator.validate(userData);

if (validData) {
    saveUser(validData);
} else {
    console.log('errors', validator.getErrors());
}
```

Common usage with camel case names ("camelizeRules" option automatically camelizes rule names):

_"camelizeRules" option registers each rule addionally with camel case name._

_Camel case names are closer to JS naming conventions but underscore rule names are more compatible with LIVR spec._ 

```javascript
import LIVR from 'livr';
LIVR.Validator.defaultAutoTrim(true);

const validator = new LIVR.Validator({
    name: 'required',
    email: ['required', 'email'],
    gender: { oneOf: ['male', 'female'] },
    phone: { maxLength: 10 },
    password: ['required', { minLength: 10 }],
    password2: { equalToField: 'password' }
});


const validData = validator.validate(userData);

if (validData) {
    saveUser(validData);
} else {
    console.log('errors', validator.getErrors());
}
```

Common usage of async version:

```javascript
import LIVR from 'livr/async';
LIVR.AsyncValidator.defaultAutoTrim(true);

const validator = new LIVR.AsyncValidator({
    name: 'required',
    email: ['required', 'email'],
    gender: { one_of: ['male', 'female'] },
    phone: { max_length: 10 },
    password: ['required', { min_length: 10 }],
    password2: { equal_to_field: 'password' }
});

try {
    const validData = await validator.validate(userData);
    saveUser(validData);
} catch(errors) {
    console.log('errors', errors);
}
```

You can use modifiers separately or can combine them with validation:

```javascript
const validator = new LIVR.Validator({
    email: ['required', 'trim', 'email', 'to_lc']
});
```

Feel free to register your own rules:

You can use aliases(preferable, syntax covered by the specification) for a lot of cases:

```javascript
const validator = new LIVR.Validator({
    password: ['required', 'strong_password']
});

validator.registerAliasedRule({
    name: 'strong_password',
    rules: { min_length: 6 },
    error: 'WEAK_PASSWORD'
});
```

Or you can write more sophisticated rules directly:

```javascript
const validator = new LIVR.Validator({
    password: ['required', 'strong_password']
});

validator.registerRules({
    strong_password() {
        return value => {
            // We already have "required" rule to check that the value is present
            if (value === undefined || value === null || value === '') return;

            if (value.length < 6) {
                return 'WEAK_PASSWORD';
            }
        };
    }
});
```

Or you can write more sophisticated **async** rules as well:

```javascript
const validator = new LIVR.AsyncValidator({
    userId: ['required', 'valid_user_id']
});

validator.registerRules({
    valid_user_id() {
        return async value => {
            // We already have "required" rule to check that the value is present
            if (value === undefined || value === null || value === '') return;

            const user = await Users.findUserById(value);
            
            if (!user) {
                return 'WRONG_USER_ID';
            }
        };
    }
});
```

If you use LIVR in browser, you can import only the rules you use (it can reduce budle size a little bit):

```javascript
import Validator from 'livr/lib/Validator';

Validator.registerDefaultRules({
    required:       require('livr/lib/rules/common/required'),
    email:          require('livr/lib/rules/special/email'),
    one_of:         require('livr/lib/rules/string/one_of'),
    min_length:     require('livr/lib/rules/string/min_length'),
    max_length:     require('livr/lib/rules/string/max_length'),
    equal_to_field: require('livr/lib/rules/special/equal_to_field')
});

Validator.defaultAutoTrim(true);

// Anywhere in your app
import Validator from 'livr/lib/Validator';

const validator = new Validator({
    name: 'required',
    email: ['required', 'email'],
    gender: { one_of: ['male', 'female'] },
    phone: { max_length: 10 },
    password: ['required', { min_length: 10 }],
    password2: { equal_to_field: 'password' }
});

const validData = validator.validate(userData);

if (validData) {
    saveUser(validData);
} else {
    console.log('errors', validator.getErrors());
}

```

# DESCRIPTION

See **[LIVR Specification and rules documentation](http://livr-spec.org)** for detailed documentation and list of supported rules.

**Features:**

-   Rules are declarative and language independent
-   Any number of rules for each field
-   Return together errors for all fields
-   Excludes all fields that do not have validation rules described
-   Has possibility to validate complex hierarchical structures
-   Easy to describe and understand rules
-   Returns understandable error codes(not error messages)
-   Easy to add own rules
-   Rules are be able to change results output ("trim", "nested_object", for example)
-   Multipurpose (user input validation, configs validation, contracts programming etc)
-   Supports sync and async validation

**JavaScript version extra features:**

-   Zero dependencies
-   Works in NodeJs and in a browser
-   Validator (without rules) less than 1KB (min+gzip)
-   Validator with all rules 2.84KB (min+gzip)
-   **You can find more rules in [livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules)**

# ASYNC VALIDATION (NEW)

LIVR supports async validation but it was added only in v2.5. So, it uses a little bit different API.

What you need to know about implementation:

1. All simple sync rules are supported out of the box.
2. Meta rules (rules that construct a new validator instance inside them) were rewritten to use AsyncValidator. 
If you import "livr/async" they will be automatically used
3. Fields validation is done in parallel but rules for one field are processed one after another.

Usage example:

```javascript
import LIVR from 'livr/async';
LIVR.AsyncValidator.defaultAutoTrim(true);

const validator = new LIVR.AsyncValidator({
    name: 'required',
    email: ['required', 'email'],
});

try {
    const validData = await validator.validate(userData);
    saveUser(validData);
} catch(errors) {
    console.log('errors', errors);
}
```

# INSTALL

### nodejs/npm

```bash
npm install livr
```

### Browser (if you do not use npm)

You can find prebuilt browser versions in "dist" folder 

* development/main.js - not minified development version with source maps
* production/main.js - minified production version. Possible you will need some polyfills ("isInteger" etc) for older browsers.
* development-async/main.js - not minified development version with source maps of "AsyncValidator"
* production-async/main.js - minified production version of "AsyncValidator"

# CLASS METHODS

## new LIVR.Validator(rules, options);

Constructor creates validator objects.
rules - validations rules. Rules description is available here - https://livr-spec.org/

**Supported options:**

* "autoTrim" (default false) - asks validator to trim all values before validation. Output will be also trimmed. If key is not passed then defaultAutoTrim value will be used.
* "camelizeRules" (default true) - each registered rule which contains uderscore will be registered using camel case name as well

_Instead of "options" object "isAutoTrim" boolean value can be passed for compatibility with previous API.
if isAutoTrim is undefined(or null) then defaultAutoTrim value will be used._

## LIVR.Validator.registerAliasedDefaultRule(alias)

alias - is a plain javascript object that contains: name, rules, error (optional).

```javascript
LIVR.Validator.registerAliasedDefaultRule({
    name: 'valid_address',
    rules: {
        nested_object: {
            country: 'required',
            city: 'required',
            zip: 'positive_integer'
        }
    }
});
```

Then you can use "valid_address" for validation:

```javascript
{
    address: 'valid_address';
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

All rules/aliases for the validator are equal. The validator does not distinguish "required", "list_of_different_objects" and "trim" rules. So, you can extend validator with any rules/alias you like.

## LIVR.Validator.registerDefaultRules({"rule_name": ruleBuilder })

ruleBuilder - is a function reference which will be called for building single rule validator.

```javascript
LIVR.Validator.registerDefaultRules({
    my_rule(arg1, arg2, arg3, ruleBuilders) {
        // ruleBuilders - are rules from original validator
        // to allow you create new validator with all supported rules
        // const validator = new LIVR.Validator(livr).registerRules(ruleBuilders).prepare();

        return (value, allValues, outputArr) => {
            if (notValid) {
                return 'SOME_ERROR_CODE';
            } else {
            }
        };
    }
});
```

Then you can use "my_rule" for validation:

```javascript
{
    name1: 'my_rule' // Call without parameters
    name2: { 'my_rule': arg1 } // Call with one parameter.
    name3: { 'my_rule': [arg1] } // Call with one parameter.
    name4: { 'my_rule': [ arg1, arg2, arg3 ] } // Call with many parameters.
}
```

Here is "max_number" implemenation:

```javascript
function maxNumber(maxNumber) {
    return value => {
        // We do not validate empty fields. We have "required" rule for this purpose
        if (value === undefined || value === null || value === '') return;

        // return error message
        if (value > maxNumber) return 'TOO_HIGH';
    };
}
LIVR.Validator.registerDefaultRules({ max_number: maxNumber });
```

All rules for the validator are equal. The validator does not distinguish "required", "list_of_different_objects" and "trim" rules. So, you can extend validator with any rules you like.

## LIVR.Validator.getDefaultRules();

returns object containing all default ruleBuilders for the validator. You can register new rule or update existing one with "registerRules" method.

## LIVR.Validator.defaultAutoTrim(isAutoTrim)

Enables or disables automatic trim for input data. If is on then every new validator instance will have auto trim option enabled

## LIVR.util

List of useful utils for writing your rules (see [source code](./lib/util.js))

# OBJECT METHODS

## validator.validate(input)

Validates user input. On success returns validData (contains only data that has described validation rules). On error return false.

```javascript
const validData = validator.validate(input);

if (validData) {
    // use validData
} else {
    const errors = validator.getErrors();
}
```

for AsyncValidator

```javascript
try {
    const validData = await validator.validate(input);
    // use validData
} catch(errors) {
    // handle errors
}
```

## validator.getErrors() (only for sync version of validator)

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

# Contributors

eNdiD

# BUGS

Please report any bugs or feature requests to Github https://github.com/koorchik/js-validator-livr
