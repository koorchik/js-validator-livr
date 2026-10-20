---
description: 'Your own rules: aliases of existing rules, rule functions, async rules, registering rules for all validators, and the TypeScript types of custom rules.'
---

# Custom rules

A custom rule is an alias of existing rules or a rule function. Register it for one validator or for all of them. With TypeScript, also [declare its type](#types-of-custom-rules): registering a rule does not give it a type.

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

Registering a rule does not give it a type. To get type inference for your own rules and aliases, declare their types in `RuleTypes`: the type of the value after the rule. Declare it once, with the `snake_case` name, and the `camelCase` name gets it too:

```ts
import LIVR from 'livr';
import type { As, AliasType } from 'livr/types/inference';

const phoneRules = ['string', { like: '^\\+?[0-9]{10,15}$' }] as const;
LIVR.Validator.registerAliasedDefaultRule({ name: 'phone', rules: phoneRules });

declare module 'livr/types/inference' {
  interface RuleTypes {
    my_rule: As<string>; // checks a string
    to_date: Date; // converts the value to a Date
    phone: AliasType<typeof phoneRules>;
  }
}
```

The declaration can be in any `.ts` file of the project that has an `import` or an `export`, for example next to the code that registers the rules. Without them, the file declares a new module instead of adding to livr. The order of the declaration and the registration does not matter.

The type of a rule is one of:

- `As<T>`: the rule checks that the value is a `T`, or converts it to `T`;
- the type itself, when the rule makes a new value, like `to_date: Date`;
- `AliasType<typeof rules>` for an alias, with its rules in a constant `as const`;
- an interface that extends `RuleType`, when the type depends on the rule arguments or on earlier rules: `{ currency: ['USD', 'EUR'] }` gives `'USD' | 'EUR'`. See [Types from arguments and earlier rules](../TYPESCRIPT.md#types-from-arguments-and-earlier-rules).

Rules that make the field required, meta rules, replaced built-in rules and rule packages are covered in [Custom rules type inference](../TYPESCRIPT.md#custom-rules-type-inference).

A rule without a type gives `unknown`. To make it a compile error, for misspelled rules and forgotten types, turn on [strict mode](../TYPESCRIPT.md#strict-mode).

## More rules

[livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules) adds rules such as `ipv4`, `boolean`, `credit_card`, `uuid`, `md5` and `iso_date` with ranges.
