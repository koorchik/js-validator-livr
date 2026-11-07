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

The declaration can be in any `.ts` file of the project that has an `import` or an `export`, for example next to the code that registers the rules. Without them, the file declares a new module instead of adding to livr. The order of the declaration and the registration does not matter. See the types in the [TypeScript Playground](https://www.typescriptlang.org/play/?#code/PTAEBUAsFNQBQDYEMCeBzATgewK4DsATUAYxmIGsBnUAFxlpQAdpqs8EUAuUASxuoBK+UACMcNGmxJI8eLDVAIsSInkYBbUIyQUkaFop7lYCHgDcMAKB7rGWDAoAyASQBqA0ADNsmgOSmLXwBua1t7BRomWABvUGc8T2gMADEfAGVSaHUkABpQF3cMmGzQAF8vH1B-cwxgSOZKYNC7BwZmUFiAQUo8ztMkSnAosoqsPwDa+pZgHgSk6DxiaCbLEFBOvFAkfspuaAAPHkoaWbRQDBwEA3wCJK3QPGgAdwekdWg8p75ILc2k7AwJCwt1AWE8vH4oKeeEsxDYxy0kDY0CEV2oAF5QABtXzHDCnXx5WKmYzcXwAPQAOpSANQAfixAAYALQATgAutEAIyMnJcgCspQAJL4yuyttQ4XhjiECgIAHSubY8AhISQYeUYaBoI40JJ9HgDaAEAAi0E8SEuNFR0AAFLE8G9oGTGEjHoTzpcWNxXcibT1QP97GSAOoCADyADkAOIAfTgAAkowBRUWlACUIVWYE6nquXnwxBObG4sWOSAclFjXzoZLSAGkAKrMtPSBAIajlyvV7623wN5u+dOgxYfbO-Ih0WCeQvFzZ8c7QGg4DDSkhkKiBnQ-MzbHDQSxyxXK1XqzXa3VJM0Wq3++2WUCgLv8Ht0W2MLWeHj7bh407D6IH0fRdl1XUBbV3BB924fByDkaFh3RAA+DogOA3hwVtI9xB4BB5SOSMsCVKC7Ug-d02HLVQM2G5zVmY0glANYskYSJQDIgwK1gKdQAAKywERQXBXwtQARxwHgtQIXw0OAnhMKmMF2L3WAAEJ0UxXEaHxPA0FFAAffTQFUjj5WfSgQ17D86P2CiQJXTZfDDKM4zgARk2SZwAA0mnQx8qIc0BaK-R4CBCdDSnCsocksDMszWAQL2OJJTnuC58wILADDkBQdTMWAFyQNpnVAW5iGQLVaHoKZqFmUAbSGBp5XHNJtJ4ItQHUYFYGyYxqCK9QjkoZh22NPNYHsNKvVAGskXEe4pnuOFbFw2AgysMqKp64FpuqCw6iiSgZjmLVR1FQDH1mPUMAtJZ6q9RqDAu4DfUebgDQGR6AB5FPBV6US9SgkKix9zNfSB3soL6-104GgNKSwgKupJbtgR7w1Ynh4VQ9C-yLf1uG0-cooRhHYXhBRKEyEpMWe-7uBxMSJKkj1fH+3x2Ri0HyBwUsnxoCsX1musmxbaKgOY7JcLJLJDQQD01kLMZ3jwGhuCK5bGFWwMMABXhNjxhQutuWKJSBaVKbVI4vwMOUiiyJB4rABMsHywE4GwAgcA6yQn2gbj6FmRJdbGqZLEWj2do6zF4mD1Ixnt7IfqiJSqeKJA4fJi3lNMU9JsxR4XiPYiVTVewvsjr2iyQ2004dzMs4RD8o4UTFINLs929PO1YnpqoaQAZgADkZflGS5AAmAeABZ+QANgAdg9SgeZF5tp4ntMG+sTDm6rmgAKAvfvZoMyecYtYYbOIzgvoghTegDsYiAqVKCwK55SUNAIJPMuNX0GgyZdb2EoLaCiIQEZAA): an alias and a rule function with their types, in strict mode.

The type of a rule is one of:

- `As<T>`: the rule checks that the value is a `T`, or converts it to `T`;
- the type itself, when the rule makes a new value, like `to_date: Date`;
- `AliasType<typeof rules>` for an alias, with its rules in a constant `as const`;
- an interface that extends `RuleType`, when the type depends on the rule arguments or on earlier rules: `{ currency: ['USD', 'EUR'] }` gives `'USD' | 'EUR'`. See [Types from arguments and earlier rules](../TYPESCRIPT.md#types-from-arguments-and-earlier-rules).

Rules that make the field required, meta rules, replaced built-in rules and rule packages are covered in [Custom rules type inference](../TYPESCRIPT.md#custom-rules-type-inference).

A rule without a type gives `unknown`. To make it a compile error, for misspelled rules and forgotten types, turn on [strict mode](../TYPESCRIPT.md#strict-mode), as new projects should.

## More rules

[livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules) adds rules such as `ipv4` and `md5`. `boolean`, `credit_card`, `uuid`, `iso_date` with ranges and most of its other rules are built in now, as [LIVR 2.5 rules](../rules.md#livr-25-rules).
