# LIVR Validator

> Lightweight, fast, and language-independent validation for JavaScript & TypeScript

[![npm version](https://badge.fury.io/js/livr.svg)](https://badge.fury.io/js/livr)
[![npm downloads](https://img.shields.io/npm/dm/livr.svg)](https://www.npmjs.com/package/livr)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/livr)](https://bundlephobia.com/package/livr)
[![Known Vulnerabilities](https://snyk.io/test/github/koorchik/js-validator-livr/badge.svg?targetFile=package.json)](https://snyk.io/test/github/koorchik/js-validator-livr?targetFile=package.json)

---

## Highlights

- **Zero dependencies** - No external runtime dependencies
- **Tiny footprint** - Validator core < 1KB, with all rules ~3KB (min+gzip)
- **TypeScript support** - Full type inference from validation schemas
- **Isomorphic** - Works in Node.js and browsers
- **Sync & async** - Both synchronous and asynchronous validation
- **Extensible** - Easy to add custom rules and aliases
- **Language independent** - Based on [LIVR Specification](http://livr-spec.org)

---

## Quick Start

```javascript
import LIVR from 'livr';

const validator = new LIVR.Validator({
    name:      'required',
    email:     ['required', 'email'],
    age:       'positive_integer',
    password:  ['required', { min_length: 8 }],
    password2: { equal_to_field: 'password' }
});

const validData = validator.validate(userData);

if (validData) {
    // Use validated & sanitized data
    saveUser(validData);
} else {
    // Handle validation errors
    console.log(validator.getErrors());
    // { email: 'WRONG_EMAIL', password: 'TOO_SHORT' }
}
```

---

## Table of Contents

- [Installation](#installation)
- [Usage Guide](#usage-guide)
  - [Basic Validation](#basic-validation)
  - [TypeScript with Type Inference](#typescript-with-type-inference)
  - [Async Validation](#async-validation)
  - [Using Modifiers](#using-modifiers)
  - [Custom Rules](#custom-rules)
- [Features](#features)
- [API Reference](#api-reference)
  - [Static Methods](#static-methods)
  - [Instance Methods](#instance-methods)
- [TypeScript Type Inference](#typescript-type-inference)
- [Performance](#performance)
- [Additional Resources](#additional-resources)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

```bash
npm install livr
```

### Browser (without npm)

Pre-built versions are available in the `dist` folder:

| Build | Description |
|-------|-------------|
| `dist/production/main.js` | Minified sync validator |
| `dist/production-async/main.js` | Minified async validator |
| `dist/development/main.js` | Development build with source maps |
| `dist/development-async/main.js` | Async development build |

---

## Usage Guide

### Basic Validation

```javascript
import LIVR from 'livr';

// Enable auto-trim globally (optional)
LIVR.Validator.defaultAutoTrim(true);

const validator = new LIVR.Validator({
    name:     'required',
    email:    ['required', 'email'],
    gender:   { one_of: ['male', 'female'] },
    phone:    { max_length: 10 },
    password: ['required', { min_length: 10 }],
    password2: { equal_to_field: 'password' }
});

const validData = validator.validate(userData);

if (validData) {
    saveUser(validData);
} else {
    console.log(validator.getErrors());
}
```

> **Note:** Rule names support both `snake_case` and `camelCase`. Use `one_of` or `oneOf`, `min_length` or `minLength` - they're equivalent.

### TypeScript with Type Inference

LIVR can automatically infer TypeScript types from your validation schema:

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

const validator = new LIVR.Validator<User>(userSchema);
const validData = validator.validate(input);

if (validData) {
    // validData is typed as User
    saveUser(validData);
}
```

> **Important:** Use `as const` after your schema to enable proper type inference.

For comprehensive TypeScript documentation including nested objects, lists, unions, and custom rule types, see **[TypeScript Type Inference Guide](./docs/TYPESCRIPT.md)**.

### Async Validation

For rules that require async operations (database lookups, API calls):

```javascript
import LIVR from 'livr/async';

const validator = new LIVR.AsyncValidator({
    username: ['required', 'unique_username'], // custom async rule
    email:    ['required', 'email'],
});

try {
    const validData = await validator.validate(userData);
    saveUser(validData);
} catch (errors) {
    console.log(errors);
}
```

**Key differences from sync validator:**
- Import from `'livr/async'`
- Use `AsyncValidator` instead of `Validator`
- `validate()` returns a Promise - use `await` or `.then()`
- On error, rejects with errors object (no `getErrors()` method)
- Fields validate in parallel; rules per field run sequentially

### Using Modifiers

Modifiers transform data during validation:

```javascript
const validator = new LIVR.Validator({
    email: ['required', 'trim', 'email', 'to_lc'],  // trim, validate, lowercase
    age:   ['positive_integer', { default: 18 }],   // default value if empty
});
```

Available modifiers: `trim`, `to_lc`, `to_uc`, `default`, `remove`, `leave_only`

### Custom Rules

#### Using Aliases (Recommended)

Create reusable rules by combining existing ones:

```javascript
const validator = new LIVR.Validator({
    password: ['required', 'strong_password'],
    age:      ['required', 'adult_age'],
});

validator.registerAliasedRule({
    name: 'strong_password',
    rules: { min_length: 8 },
    error: 'WEAK_PASSWORD'
});

validator.registerAliasedRule({
    name: 'adult_age',
    rules: ['positive_integer', { min_number: 18 }],
    error: 'MUST_BE_ADULT'
});
```

#### Writing Custom Rule Functions

For complex validation logic:

```javascript
const validator = new LIVR.Validator({
    password: ['required', 'strong_password'],
});

validator.registerRules({
    strong_password() {
        return (value) => {
            // Empty values are handled by 'required' rule
            if (value === undefined || value === null || value === '') return;

            if (!/[A-Z]/.test(value)) return 'MISSING_UPPERCASE';
            if (!/[a-z]/.test(value)) return 'MISSING_LOWERCASE';
            if (!/[0-9]/.test(value)) return 'MISSING_DIGIT';
            if (value.length < 8) return 'TOO_SHORT';
        };
    }
});
```

#### Async Custom Rules

```javascript
import LIVR from 'livr/async';

const validator = new LIVR.AsyncValidator({
    username: ['required', 'unique_username'],
});

validator.registerRules({
    unique_username() {
        return async (value) => {
            if (value === undefined || value === null || value === '') return;

            const exists = await db.users.exists({ username: value });
            if (exists) return 'USERNAME_TAKEN';
        };
    }
});
```

#### Registering Rules Globally

```javascript
// Register for all future validator instances
LIVR.Validator.registerDefaultRules({
    my_rule(arg1, arg2) {
        return (value, allValues, outputArr) => {
            // Return error code on failure, undefined on success
            if (invalid) return 'ERROR_CODE';
        };
    }
});

LIVR.Validator.registerAliasedDefaultRule({
    name: 'valid_address',
    rules: { nested_object: { country: 'required', city: 'required' }}
});
```

### Tree-Shaking (Reduce Bundle Size)

Import only the rules you need:

```javascript
import Validator from 'livr/lib/Validator';

Validator.registerDefaultRules({
    required:       require('livr/lib/rules/common/required'),
    email:          require('livr/lib/rules/special/email'),
    min_length:     require('livr/lib/rules/string/min_length'),
    max_length:     require('livr/lib/rules/string/max_length'),
    equal_to_field: require('livr/lib/rules/special/equal_to_field'),
});

const validator = new Validator({ /* schema */ });
```

---

## Features

### Core Features

- **Declarative schemas** - Rules are language-independent JSON structures
- **Multiple rules per field** - Chain any number of validators
- **Aggregated errors** - Returns all errors at once, not just the first
- **Data sanitization** - Output contains only validated fields
- **Hierarchical validation** - Validate nested objects and arrays
- **Readable error codes** - Returns codes like `REQUIRED`, `TOO_SHORT` (not messages)
- **Output transformation** - Rules can modify output (`trim`, `default`, etc.)

### JavaScript-Specific Features

- **Zero dependencies** - No external runtime dependencies
- **Tiny bundle** - Core validator < 1KB (min+gzip)
- **TypeScript inference** - Derive types from schemas automatically
- **Isomorphic** - Same code works in Node.js and browsers
- **Additional rules** - See [livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules)

---

## API Reference

### Static Methods

#### `new LIVR.Validator(schema, options?)`

Creates a new validator instance.

```javascript
const validator = new LIVR.Validator(schema, { autoTrim: true });
```

| Option | Default | Description |
|--------|---------|-------------|
| `autoTrim` | `false` | Trim all string values before validation |

#### `Validator.defaultAutoTrim(boolean)`

Enable/disable auto-trim globally for all new instances.

```javascript
LIVR.Validator.defaultAutoTrim(true);
```

#### `Validator.registerDefaultRules(rules)`

Register custom rules globally.

```javascript
LIVR.Validator.registerDefaultRules({
    my_rule(arg) {
        return (value) => { /* ... */ };
    }
});
```

#### `Validator.registerAliasedDefaultRule(alias)`

Register a rule alias globally.

```javascript
LIVR.Validator.registerAliasedDefaultRule({
    name: 'adult_age',
    rules: ['positive_integer', { min_number: 18 }],
    error: 'MUST_BE_ADULT'  // optional custom error
});
```

#### `Validator.getDefaultRules()`

Returns all registered default rules.

### Instance Methods

#### `validator.validate(data)`

Validates input data against the schema.

**Sync Validator:**
```javascript
const result = validator.validate(data);
if (result) {
    // result contains validated data
} else {
    const errors = validator.getErrors();
}
```

**Async Validator:**
```javascript
try {
    const result = await validator.validate(data);
} catch (errors) {
    // errors object
}
```

#### `validator.getErrors()`

Returns the errors object from the last validation (sync only).

```javascript
// Example output:
{
    email: 'WRONG_EMAIL',
    password: 'TOO_SHORT',
    address: { zip: 'NOT_POSITIVE_INTEGER' }
}
```

#### `validator.prepare()`

Pre-compiles validation rules. Called automatically on first `validate()`, but can be called manually for warmup.

```javascript
const validator = new LIVR.Validator(schema).prepare();
```

#### `validator.registerRules(rules)`

Register rules for this instance only.

```javascript
validator.registerRules({
    custom_rule() { return (value) => { /* ... */ }; }
});
```

#### `validator.registerAliasedRule(alias)`

Register a rule alias for this instance only.

```javascript
validator.registerAliasedRule({
    name: 'strong_password',
    rules: { min_length: 8 },
    error: 'WEAK_PASSWORD'
});
```

#### `validator.getRules()`

Returns all rules registered for this instance.

---

## TypeScript Type Inference

LIVR automatically infers TypeScript types from your validation schemas:

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const schema = {
    name: ['required', 'string'],
    age: 'positive_integer',
    role: { one_of: ['admin', 'user'] as const },
} as const;

type User = InferFromSchema<typeof schema>;
// { name: string; age?: number; role?: 'admin' | 'user' }
```

For complete documentation on type inference including:
- Required vs optional fields
- Nested objects and arrays
- Discriminated unions
- Custom rule type definitions

See the **[TypeScript Type Inference Guide](./docs/TYPESCRIPT.md)**.

---

## Performance

LIVR is designed for speed:

- **Reuse validators** - Construct once, validate many times. `validator.validate()` is extremely fast.
- **Lazy compilation** - Rules are compiled on first validation (or call `prepare()` for warmup).
- **Faster than alternatives** - 2x faster than Joi, 100x faster rule compilation than fastest-validator.

```javascript
// Good: Create once, use many times
const validator = new LIVR.Validator(schema);

for (const item of items) {
    const result = validator.validate(item);
}

// Avoid: Creating validator for each validation
for (const item of items) {
    const validator = new LIVR.Validator(schema);  // Slower
    const result = validator.validate(item);
}
```

---

## Additional Resources

- **[LIVR Specification](http://livr-spec.org)** - Full specification and rule documentation
- **[livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules)** - Additional validation rules
- **[TypeScript Guide](./docs/TYPESCRIPT.md)** - Comprehensive TypeScript documentation

---

## Contributing

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/koorchik/js-validator-livr/issues).

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Author

**Viktor Turskyi** ([@koorchik](https://github.com/koorchik))

### Contributors

- eNdiD
