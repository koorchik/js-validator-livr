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
    password2: { equal_to_field: 'password' },
});

const validData = validator.validate(userData);

if (validData) {
    saveUser(validData);
} else {
    console.log('errors', validator.getErrors());
}
```

All standard rules are supported in camel case as well (Validator.registerDefaultRules always does autocamelization):

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
    password2: { equalToField: 'password' },
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
    password2: { equal_to_field: 'password' },
});

try {
    const validData = await validator.validate(userData);
    saveUser(validData);
} catch (errors) {
    console.log('errors', errors);
}
```

TypeScript usage with type inference:

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const userSchema = {
    name: ['required', 'string'],
    email: ['required', 'email'],
    age: 'positive_integer',
    role: { one_of: ['admin', 'user'] as const },
} as const;

// Automatically infer type from schema
type User = InferFromSchema<typeof userSchema>;
// Result: { name: string; email: string; age?: number; role?: 'admin' | 'user' }

// Pass the inferred type as a generic parameter
const validator = new LIVR.Validator<User>(userSchema);
const validData = validator.validate(userData);

if (validData) {
    // validData is typed as User
    saveUser(validData);
} else {
    console.log('errors', validator.getErrors());
}
```

You can use modifiers separately or can combine them with validation:

```javascript
const validator = new LIVR.Validator({
    email: ['required', 'trim', 'email', 'to_lc'],
});
```

Feel free to register your own rules:

You can use aliases(preferable, syntax covered by the specification) for a lot of cases:

```javascript
const validator = new LIVR.Validator({
    password: ['required', 'strong_password'],
});

validator.registerAliasedRule({
    name: 'strong_password',
    rules: { min_length: 6 },
    error: 'WEAK_PASSWORD',
});
```

Or you can write more sophisticated rules directly:

```javascript
const validator = new LIVR.Validator({
    password: ['required', 'strong_password'],
});

validator.registerRules({
    strong_password() {
        return (value) => {
            // We already have "required" rule to check that the value is present
            if (value === undefined || value === null || value === '') return;

            if (value.length < 6) {
                return 'WEAK_PASSWORD';
            }
        };
    },
});
```

Or you can write more sophisticated **async** rules as well:

```javascript
const validator = new LIVR.AsyncValidator({
    userId: ['required', 'valid_user_id'],
});

validator.registerRules({
    valid_user_id() {
        return async (value) => {
            // We already have "required" rule to check that the value is present
            if (value === undefined || value === null || value === '') return;

            const user = await Users.findUserById(value);

            if (!user) {
                return 'WRONG_USER_ID';
            }
        };
    },
});
```

If you use LIVR in browser, you can import only the rules you use (it can reduce budle size a little bit):

```javascript
import Validator from 'livr/lib/Validator';

Validator.registerDefaultRules({
    required: require('livr/lib/rules/common/required'),
    email: require('livr/lib/rules/special/email'),
    one_of: require('livr/lib/rules/string/one_of'),
    min_length: require('livr/lib/rules/string/min_length'),
    max_length: require('livr/lib/rules/string/max_length'),
    equal_to_field: require('livr/lib/rules/special/equal_to_field'),
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
    password2: { equal_to_field: 'password' },
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
-   **TypeScript type inference** - automatically derive types from validation schemas
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
} catch (errors) {
    console.log('errors', errors);
}
```

# TYPESCRIPT TYPE INFERENCE

LIVR provides TypeScript type inference that allows you to automatically derive types from your validation schemas. This gives you type safety without manually defining interfaces that duplicate your validation rules.

## Basic Usage

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const userSchema = {
    name: ['required', 'string'],
    email: ['required', 'email'],
    age: 'positive_integer',
} as const;

// Infer the type from the schema
type User = InferFromSchema<typeof userSchema>;
// Result: { name: string; email: string; age?: number }

// Pass the inferred type as a generic parameter
const validator = new LIVR.Validator<User>(userSchema);
const result = validator.validate(input);

if (result) {
    // result is typed as User
    console.log(result.name); // string
    console.log(result.age);  // number | undefined
}
```

**Important:** Always use `as const` after your schema definition to preserve literal types and enable proper inference.

## How Types Are Inferred

### Required vs Optional Fields

By default, all fields are **optional**. Use the `required` rule to make a field mandatory:

```typescript
const schema = {
    requiredField: ['required', 'string'],  // string (required)
    optionalField: 'string',                 // string | undefined (optional)
} as const;

type Data = InferFromSchema<typeof schema>;
// { requiredField: string; optionalField?: string }
```

The `default` rule also makes fields non-optional since they always have a value:

```typescript
const schema = {
    count: [{ default: 0 }, 'integer'],     // number (has default)
    enabled: { default: true },              // true (has default)
} as const;

type Config = InferFromSchema<typeof schema>;
// { count: number; enabled: true }
```

### Primitive Type Rules

| Rule | Inferred Type |
|------|---------------|
| `string` | `string` |
| `integer`, `positive_integer` | `number` |
| `decimal`, `positive_decimal` | `number` |
| `email`, `url`, `iso_date` | `string` |
| `trim`, `to_lc`, `to_uc` | `string` |
| `max_length`, `min_length`, etc. | `string` |
| `max_number`, `min_number`, etc. | `number` |

### Literal Types with `one_of` and `eq`

To get literal union types, use `as const` on the values array:

```typescript
const schema = {
    // Without as const: string
    // With as const: 'admin' | 'user' | 'guest'
    role: { one_of: ['admin', 'user', 'guest'] as const },

    // Literal type: 'active'
    status: { eq: 'active' as const },
} as const;

type Data = InferFromSchema<typeof schema>;
// { role?: 'admin' | 'user' | 'guest'; status?: 'active' }
```

## Complex Schemas

### Nested Objects

```typescript
const schema = {
    user: {
        nested_object: {
            name: ['required', 'string'],
            email: 'email',
            address: {
                nested_object: {
                    city: ['required', 'string'],
                    zip: 'positive_integer',
                },
            },
        },
    },
} as const;

type Data = InferFromSchema<typeof schema>;
// {
//     user?: {
//         name: string;
//         email?: string;
//         address?: {
//             city: string;
//             zip?: number;
//         };
//     };
// }
```

### Lists

```typescript
const schema = {
    // List of numbers
    ids: { list_of: 'positive_integer' },

    // List of strings with validation
    tags: { list_of: ['required', 'string', { max_length: 50 }] },

    // List of objects
    items: {
        list_of_objects: {
            id: ['required', 'positive_integer'],
            name: ['required', 'string'],
            quantity: 'positive_integer',
        },
    },
} as const;

type Data = InferFromSchema<typeof schema>;
// {
//     ids?: number[];
//     tags?: string[];
//     items?: Array<{
//         id: number;
//         name: string;
//         quantity?: number;
//     }>;
// }
```

### Discriminated Unions

For polymorphic data with a type discriminator:

```typescript
const schema = {
    events: {
        list_of_different_objects: [
            'type',  // Discriminator field
            {
                click: {
                    type: { eq: 'click' as const },
                    x: ['required', 'integer'],
                    y: ['required', 'integer'],
                },
                scroll: {
                    type: { eq: 'scroll' as const },
                    direction: { one_of: ['up', 'down'] as const },
                },
            },
        ],
    },
} as const;

type Data = InferFromSchema<typeof schema>;
// {
//     events?: Array<
//         | { type: 'click'; x: number; y: number }
//         | { type: 'scroll'; direction?: 'up' | 'down' }
//     >;
// }
```

### Union Types with `or`

```typescript
const schema = {
    // Can be either a string or a number
    value: { or: ['string', 'integer'] },
} as const;

type Data = InferFromSchema<typeof schema>;
// { value?: string | number }
```

# INSTALL

### nodejs/npm

```bash
npm install livr
```

### Browser (if you do not use npm)

You can find prebuilt browser versions in "dist" folder

-   development/main.js - not minified development version with source maps
-   production/main.js - minified production version. Possible you will need some polyfills ("isInteger" etc) for older browsers.
-   development-async/main.js - not minified development version with source maps of "AsyncValidator"
-   production-async/main.js - minified production version of "AsyncValidator"

# CLASS METHODS

## new LIVR.Validator(rules, options);

Constructor creates validator objects.
rules - validations rules. Rules description is available here - https://livr-spec.org/

**Supported options:**

-   "autoTrim" (default false) - asks validator to trim all values before validation. Output will be also trimmed. If key is not passed then defaultAutoTrim value will be used.

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
            zip: 'positive_integer',
        },
    },
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

_Note: Each rule which contains uderscore in name will be additionally registered using camel case name if there is no such rule name already._

## LIVR.Validator.registerDefaultRules({"rule_name": ruleBuilder })

ruleBuilder - is a function reference which will be called for building single rule validator.

_Note: Each rule which contains uderscore in name will be additionally registered using camel case name if there is no such rule name already._

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
    },
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
    return (value) => {
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

## validator.prepare()

Parses all validation rules to make subsequent calls faster. This step is always automatically called on first call of validator.validate(input) but you can call it manually if you want to warm up your validator object before validation was called. Usually, it is useful in several cases:

-   Benchmarks. As first validation call will take more time without prepare
-   Custom meta rules. Just to prepare nested validators when parent validator prepare method is called.

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
} catch (errors) {
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

# CUSTOM RULES TYPE INFERENCE

When you create custom validation rules, you can also define their type inference behavior to work with TypeScript.

## Registering Custom Rules with Type Inference

### Step 1: Create the Rule Implementation

```typescript
// my-rules/phone_number.js
module.exports = function phoneNumber(countryCode) {
    return (value) => {
        if (value === undefined || value === null || value === '') return;

        // Your validation logic here
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(value)) {
            return 'INVALID_PHONE_NUMBER';
        }
    };
};
```

### Step 2: Create Type Definition File

Create a `.d.ts` file alongside your rule (or in your types directory):

```typescript
// my-rules/phone_number.d.ts
import type { RuleTypeDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
    interface RuleTypeRegistry {
        // Simple rule that outputs string
        phone_number: RuleTypeDef<string, false, false>;

        // Also register camelCase version
        phoneNumber: RuleTypeRegistry['phone_number'];
    }
}
```

### Step 3: Use the Rule with Type Inference

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';
import phoneNumber from './my-rules/phone_number';

// Register the rule
LIVR.Validator.registerDefaultRules({ phone_number: phoneNumber });

const schema = {
    name: ['required', 'string'],
    phone: ['required', 'phone_number'],
} as const;

type Contact = InferFromSchema<typeof schema>;
// { name: string; phone: string }

// Pass the inferred type as a generic parameter
const validator = new LIVR.Validator<Contact>(schema);
const result = validator.validate(input);
// result is typed as Contact | false
```

## Advanced: Rules with Parameterized Output Types

For rules where the output type depends on the arguments:

### Example: Enum Rule with Literal Types

```typescript
// my-rules/enum_value.js
module.exports = function enumValue(allowedValues) {
    return (value) => {
        if (value === undefined || value === null || value === '') return;
        if (!allowedValues.includes(value)) {
            return 'NOT_ALLOWED_VALUE';
        }
    };
};
```

For parameterized rules, you need to add special handling in the type inference. The built-in parameterized rules (`one_of`, `eq`, `nested_object`, `list_of`, etc.) are already handled. For custom parameterized rules, you have two options:

**Option 1: Use existing rules as building blocks**

```typescript
// Use one_of which already has proper type inference
const schema = {
    status: { one_of: ['pending', 'active', 'closed'] as const },
} as const;
```

**Option 2: Create an aliased rule**

```typescript
// Register as aliased rule - types will flow through
LIVR.Validator.registerAliasedDefaultRule({
    name: 'status_enum',
    rules: { one_of: ['pending', 'active', 'closed'] },
});
```

## RuleTypeDef Parameters

When defining custom rule types:

```typescript
RuleTypeDef<TOutput, TRequiredEffect, TDefaultEffect>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `TOutput` | `any` | The TypeScript type this rule produces |
| `TRequiredEffect` | `boolean` | Set to `true` if this rule makes the field required |
| `TDefaultEffect` | `boolean` | Set to `true` if this rule provides a default value |

### Examples

```typescript
// Simple string output
RuleTypeDef<string, false, false>

// Makes field required (like 'required' rule)
RuleTypeDef<unknown, true, false>

// Provides default value (like 'default' rule)
RuleTypeDef<unknown, false, true>

// Number output
RuleTypeDef<number, false, false>

// Object output
RuleTypeDef<{ id: number; name: string }, false, false>
```

## Type Inference for External Rule Packages

If you're publishing a package with LIVR rules, include type definitions:

```typescript
// my-livr-rules/types.d.ts
import 'livr';
import type { RuleTypeDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
    interface RuleTypeRegistry {
        // Your custom rules
        uuid: RuleTypeDef<string, false, false>;
        iso_timestamp: RuleTypeDef<string, false, false>;
        json_string: RuleTypeDef<object, false, false>;

        // CamelCase aliases
        isoTimestamp: RuleTypeRegistry['iso_timestamp'];
        jsonString: RuleTypeRegistry['json_string'];
    }
}
```

Users of your package will automatically get type inference when they import it:

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';
import 'my-livr-rules'; // Imports rules and type augmentations

const schema = {
    id: ['required', 'uuid'],
    createdAt: 'iso_timestamp',
} as const;

type Record = InferFromSchema<typeof schema>;
// { id: string; createdAt?: string }
```

## Available Type Exports

```typescript
import type {
    // Main inference type
    InferFromSchema,

    // Infer type from a single rule (useful for list elements)
    InferRuleType,

    // Schema and rule definition types
    LIVRSchema,
    LIVRRuleDefinition,
    LIVRPrimitive,

    // For defining custom rule types
    RuleTypeDef,
    RuleTypeRegistry,

    // Utility types
    Simplify,
    SimpleRule,
    RequiredRule,
    ParameterizedRule,
    DefaultRule,
} from 'livr/types';
```

# Performance

LIVR is fast but you should be aware about following:

Do not construct Validator for each validation call. Construct object once for each schema and reuse validators with different inputs. "validator.validate(input)" is very fast.

In some cases you need to construct object each time, it is slower but still ok. It still will be twice faster than "Joi". LIVR validator preparation (rules compile step) is 100 time faster than "fastest-validator" compile time.

# AUTHOR

koorchik (Viktor Turskyi)

# Contributors

eNdiD

# BUGS

Please report any bugs or feature requests to Github https://github.com/koorchik/js-validator-livr
