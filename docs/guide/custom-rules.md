# Custom rules

## Aliases (recommended)

Combine existing rules into a rule of your domain, with its own error code:

```js
const validator = new LIVR.Validator({
  password: ['required', 'strong_password'],
  age: ['required', 'adult_age'],
});

validator.registerAliasedRule({
  name: 'strong_password',
  rules: { min_length: 8 },
  error: 'WEAK_PASSWORD',
});

validator.registerAliasedRule({
  name: 'adult_age',
  rules: ['positive_integer', { min_number: 18 }],
  error: 'MUST_BE_ADULT',
});
```

An alias is data too: its rules are a regular LIVR schema, so aliases can be loaded from a config file or a database, and they work the same in every LIVR implementation.

## Rule functions

A rule is a factory: it receives the rule arguments and returns a function that checks one value. The function returns an error code on failure and nothing on success:

```js
const validator = new LIVR.Validator({
  password: ['required', 'strong_password'],
});

validator.registerRules({
  strong_password() {
    return value => {
      // Empty values are the job of 'required'
      if (value === undefined || value === null || value === '') return;

      if (!/[A-Z]/.test(value)) return 'MISSING_UPPERCASE';
      if (!/[a-z]/.test(value)) return 'MISSING_LOWERCASE';
      if (!/[0-9]/.test(value)) return 'MISSING_DIGIT';
      if (value.length < 8) return 'TOO_SHORT';
    };
  },
});
```

The function gets three arguments: `(value, allValues, outputArr)`. `allValues` is the whole input object, for rules that compare fields. To change the output, push the new value to `outputArr`:

```js
validator.registerRules({
  to_date() {
    return (value, allValues, outputArr) => {
      if (value === undefined || value === null || value === '') return;

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'WRONG_DATE';
      outputArr.push(date);
    };
  },
});
```

The factory runs once, when the validator compiles its rules, so do the expensive work there (for example, build a regular expression from the arguments) and keep the returned function small.

## Async rules

With `AsyncValidator`, a rule can return a promise:

```js
import LIVR from 'livr/async';

const validator = new LIVR.AsyncValidator({
  username: ['required', 'unique_username'],
});

validator.registerRules({
  unique_username() {
    return async value => {
      if (value === undefined || value === null || value === '') return;

      const exists = await db.users.exists({ username: value });
      if (exists) return 'USERNAME_TAKEN';
    };
  },
});
```

## Registering rules globally

Rules and aliases registered on the class are available to every validator created afterwards, sync and async:

```js
LIVR.Validator.registerDefaultRules({
  my_rule(arg1, arg2) {
    return (value, allValues, outputArr) => {
      if (invalid) return 'ERROR_CODE';
    };
  },
});

LIVR.Validator.registerAliasedDefaultRule({
  name: 'valid_address',
  rules: { nested_object: { country: 'required', city: 'required' } },
});
```

## Types of custom rules

To get type inference for your own rules, register their output types. See [Custom rules type inference](/typescript#custom-rules-type-inference).

## More rules

[livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules) adds rules such as `ipv4`, `boolean`, `credit_card`, `uuid`, `md5` and `iso_date` with ranges.
