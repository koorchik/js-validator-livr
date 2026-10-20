---
description: 'Validating data, error codes, modifiers, auto-trim, async validation with AsyncValidator, smaller bundles and performance tips.'
---

# Usage

## Basic validation

```js
import LIVR from 'livr';

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
  console.log(validator.getErrors());
}
```

Construct a validator once and use it for many inputs: rules are compiled on the first validation, and every later `validate()` call only runs them. Call `prepare()` to compile them in advance.

## Errors

Errors are codes, not messages, and they mirror the structure of the input:

```js
{
  email: 'WRONG_EMAIL',
  password: 'TOO_SHORT',
  address: { zip: 'NOT_POSITIVE_INTEGER' },
  tags: [null, 'TOO_LONG'],
}
```

All errors are returned at once. Translate the codes in your UI and attach them to form fields by path. The [error codes](https://livr-spec.org/validation-rules/error-codes.html) are the same in every LIVR implementation.

## Modifiers

Modifiers change the output while it is validated:

```js
const validator = new LIVR.Validator({
  email: ['required', 'trim', 'email', 'to_lc'], // trim, validate, lowercase
  age: ['positive_integer', { default: 18 }], // a default for an empty value
});
```

Available modifiers: `trim`, `to_lc`, `to_uc`, `default`, `remove`, `leave_only`. Numeric rules also convert valid strings to numbers, so `'42'` from a form becomes `42` in the output.

## Auto-trim

Trim every string before validation, for one validator or for all of them:

```js
const validator = new LIVR.Validator(schema, { autoTrim: true });

LIVR.Validator.defaultAutoTrim(true); // all validators created after this call
```

## Async validation

For rules that query a database or call an API:

```js
import LIVR from 'livr/async';

const validator = new LIVR.AsyncValidator({
  username: ['required', 'unique_username'], // a custom async rule
  email: ['required', 'email'],
});

try {
  const validData = await validator.validate(userData);
  saveUser(validData);
} catch (errors) {
  console.log(errors);
}
```

Differences from the sync validator:

- Import from `'livr/async'` and use `AsyncValidator`
- `validate()` returns a promise, and rejects with the errors object (there is no `getErrors()`)
- Fields are validated in parallel, the rules of one field run one after another
- Sync rules stay sync: a field waits for a promise only when one of its rules returns one

## Smaller bundles

`livr` registers all built-in rules. To ship only the rules you use, start from the bare validator:

```js
import Validator from 'livr/lib/Validator';
import required from 'livr/lib/rules/common/required';
import email from 'livr/lib/rules/special/email';
import min_length from 'livr/lib/rules/string/min_length';
import equal_to_field from 'livr/lib/rules/special/equal_to_field';

Validator.registerDefaultRules({ required, email, min_length, equal_to_field });

const validator = new Validator({
  email: ['required', 'email'],
  password: ['required', { min_length: 8 }],
  password2: { equal_to_field: 'password' },
});
```

The validator core is about 2 KB min+gzip. See [Zero dependencies](/why/zero-dependencies) for the sizes.

## Performance tips

```js
// Good: create once, validate many times
const validator = new LIVR.Validator(schema);

for (const item of items) {
  const result = validator.validate(item);
}

// Slower: a new validator for every item
for (const item of items) {
  const validator = new LIVR.Validator(schema);
  const result = validator.validate(item);
}
```

Creating validators is cheap too: LIVR is the fastest in the benchmark that creates a validator for every call. Still, a reused validator is 2–3 times faster. See [Performance](/why/performance).
