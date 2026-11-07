# LIVR Validator

> Validation rules that are just data. The fastest JavaScript validator in the benchmarks, also when rules are built at runtime, with TypeScript types inferred from the schema and zero dependencies.

[![npm version](https://badge.fury.io/js/livr.svg)](https://badge.fury.io/js/livr)
[![npm downloads](https://img.shields.io/npm/dm/livr.svg)](https://www.npmjs.com/package/livr)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/livr)](https://bundlephobia.com/package/livr)
[![Known Vulnerabilities](https://snyk.io/test/github/koorchik/js-validator-livr/badge.svg?targetFile=package.json)](https://snyk.io/test/github/koorchik/js-validator-livr?targetFile=package.json)

## Documentation

The full documentation is at **[js.livr-spec.org](https://js.livr-spec.org)**:

- [Getting started](https://js.livr-spec.org/guide/getting-started): install, the first validator, errors and types
- [Custom rules](https://js.livr-spec.org/guide/custom-rules): aliases, rule functions and their types
- [TypeScript](https://js.livr-spec.org/typescript): type inference and strict mode
- [API](https://js.livr-spec.org/api): `Validator` and `AsyncValidator`, their options and methods, registering rules
- [LIVR specification](https://livr-spec.org): the rules and the test suite shared by all implementations

The guides, the API and the TypeScript guide are also in the package, in `node_modules/livr/docs`. For AI assistants: [llms.txt](https://js.livr-spec.org/llms.txt), and the whole documentation in one file, [llms-full.txt](https://js.livr-spec.org/llms-full.txt).

---

## Why LIVR

**Rules are just data.** A schema is a plain JSON structure, not code. Store it in a database, send it over the wire, share it with services written in other languages, build it at runtime, and load it safely even from untrusted sources: LIVR never turns a schema into code. [Why schemas as data →](https://js.livr-spec.org/why/schemas-are-data)

**Incredible performance, also for rules built at runtime.** The fastest in the benchmarks against Valibot, Zod, fastest-validator, Ajv and Joi. Most validators are fast only when a schema is compiled once; when rules come from a database, differ per tenant or come from a form builder, every call needs a new validator. There LIVR is tens to hundreds of times faster than Zod, fastest-validator and Ajv, and needs less than a microsecond to create a validator and validate a form. [Benchmarks →](https://js.livr-spec.org/why/performance)

<p>
  <a href="https://js.livr-spec.org/why/performance"><img src="https://js.livr-spec.org/benchmark/latest-static.svg" alt="Benchmark: rules fixed in code, validator created once" width="49%"></a>
  <a href="https://js.livr-spec.org/why/performance#rules-built-at-runtime"><img src="https://js.livr-spec.org/benchmark/latest-dynamic.svg" alt="Benchmark: rules built at runtime, validator created per call" width="49%"></a>
</p>

**Type inference.** TypeScript infers the type of the validated data from the schema itself: required and optional fields, literal unions from `one_of`, nested objects, lists and your own rules. No second definition to keep in sync. [How it works →](https://js.livr-spec.org/why/type-inference)

**Zero dependencies.** Nothing to audit but LIVR itself. About 2 KB for the core, 5 KB with the 35 rules of LIVR 2.0 and 13 KB with all 68 built-in rules, min+gzip, and it runs in Node.js, browsers and edge runtimes. [Why zero dependencies →](https://js.livr-spec.org/why/zero-dependencies)

**Proven.** Maintained since 2013 and built on the [LIVR specification](https://livr-spec.org) (it implements LIVR 2.0 and LIVR 2.5), whose shared test suite collects edge cases found in implementations in 11 languages. [More →](https://js.livr-spec.org/why/proven)

Also: error codes shaped like your data, validation and transformation in one pass, [aliases and custom rules](https://js.livr-spec.org/guide/custom-rules), and a sync and an async validator. The [design decisions](https://js.livr-spec.org/why/design-decisions) explain why LIVR works the way it does.

---

## Installation

```bash
npm install livr
```

Works in Node.js and, through any bundler or an ESM CDN like `https://esm.sh/livr`, in browsers.

## Quick Start

```javascript
import LIVR from 'livr';

const validator = new LIVR.Validator({
  name: 'required',
  email: ['required', 'email'],
  age: 'positive_integer',
  password: ['required', { min_length: 8 }],
  password2: { equal_to_field: 'password' },
});

const validData = validator.validate(userData);

if (validData) {
  saveUser(validData); // validated data, fields without rules removed
} else {
  console.log(validator.getErrors());
  // { email: 'WRONG_EMAIL', password: 'TOO_SHORT' }
}
```

With TypeScript, the type comes from the schema:

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const schema = {
  name: ['required', 'string'],
  age: 'positive_integer',
  role: { one_of: ['admin', 'user'] },
} as const;

type User = InferFromSchema<typeof schema>;
// { name: string; age?: number; role?: 'admin' | 'user' }

const validator = new LIVR.Validator<User>(schema);
```

In a new project, turn on [strict mode](https://js.livr-spec.org/typescript#strict-mode): a misspelled rule or a rule without a type is a compile error then, instead of the `unknown` type. It is off by default, so existing projects keep compiling: turn it on there once every custom rule has a type.

```typescript
// livr-options.ts: the import makes the file a module and loads the types of livr
import type {} from 'livr/types/inference';

declare module 'livr/types/inference' {
  interface TypeOptions {
    strictRules: true;
  }
}
```

Next: [usage guide](https://js.livr-spec.org/guide/usage) (modifiers, async validation, smaller bundles), [custom rules](https://js.livr-spec.org/guide/custom-rules), [API reference](https://js.livr-spec.org/api).

## Custom Rules

An alias gives a set of existing rules a name and an error code. A rule function gets the rule arguments and returns a function that checks one value: it returns an error code, or nothing when the value is valid. With TypeScript, declare the type of every custom rule and alias in `RuleTypes`, the type of the value after the rule: registering a rule does not give it a type.

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';
import type { As, AliasType } from 'livr/types/inference';

// An alias: 'phone' in a schema runs 'string' and 'like', with an error code of its own
const phoneRules = ['string', { like: '^\\+?[0-9]{10,15}$' }] as const;
LIVR.Validator.registerAliasedDefaultRule({
  name: 'phone',
  rules: phoneRules,
  error: 'WRONG_PHONE',
});

// A rule function: { starts_with: 'SKU-' } calls starts_with('SKU-') once, when a validator
// compiles its rules, and the function it returns checks each value
LIVR.Validator.registerDefaultRules({
  starts_with(prefix: string) {
    return (value: unknown) => {
      if (LIVR.util.isNoValue(value)) return undefined; // empty values are the job of 'required'
      if (typeof value !== 'string' || !value.startsWith(prefix)) return 'WRONG_PREFIX';
      return undefined;
    };
  },
});

// The types, in any .ts file of the project with an import or an export
declare module 'livr/types/inference' {
  interface RuleTypes {
    phone: AliasType<typeof phoneRules>;
    starts_with: As<string>; // checks a string, `startsWith` gets the type too
  }
}

const schema = {
  phone: ['required', 'phone'],
  sku: { starts_with: 'SKU-' },
} as const;

type Product = InferFromSchema<typeof schema>; // { phone: string; sku?: string }
```

See the types in the [TypeScript Playground](https://www.typescriptlang.org/play/?#code/PTAEBUAsFNQBQDYEMCeBzATgewK4DsATUAYxmIGsBnUAFxlpQAdpqs8EUAuUASxuoBK+UACMcNGmxJI8eLDVAIsSInkYBbUIyQUkaFop7lYCHgDcMAKB7rGWDAoAyASQBqA0ADNsmgOSmLXwBua1t7BRomWABvUGc8T2gMADEfAGVSaHUkABpQF3cMmGzQAF8vH1B-cwxgSOZKYNC7BwZmUFiAQUo8ztMkSnAosoqsPwDa+pZgHgSk6DxiaCbLEFBOvFAkfspuaAAPHkoaWbRQDBwEA3wCJK3QPGgAdwekdWg8p75ILc2k7AwJCwt1AWE8vH4oKeeEsxDYxy0kDY0CEV2oAF5QABtXzHDCnXx5WKmYzcXwAPQAOpSANQAfixAAYALQATgAutEAIyMnJcgCspQAJL4yuyttQ4XhjiECgIAHSubY8AhISQYeUYaBoI40JJ9HgDaAEAAi0E8SEuNFR0AAFLE8G9oGTGEjHoTzpcWNxXcibT1QP97GSAOoCADyADkAOIAfTgAAkowBRUWlACUIVWYE6nquXnwxBObG4sWOSAclFjXzoZLSAGkAKrMtPSBAIajlyvV7623wN5u+dOgxYfbO-Ih0WCeQvFzZ8c7QGg4DDSkhkKiBnQ-MzbHDQSxyxXK1XqzXa3VJM0Wq3++2WUCgLv8Ht0W2MLWeHj7bh407D6IH0fRdl1XUBbV3BB924fByDkaFh3RAA+DogOA3hwVtI9xB4BB5SOSMsCVKC7Ug-d02HLVQM2G5zVmY0glANYskYSJQDIgwK1gKdQAAKywERQXBXwtQARxwHgtQIXw0OAnhMKmMF2L3WAAEJ0UxXEaHxPA0FFAAffTQFUjj5WfSgQ17D86P2CiQJXTZfDDKM4zgARk2SZwAA0mnQx8qIc0BaK-R4CBCdDSnCsocksDMszWAQL2OJJTnuC58wILADDkBQdTMWAFyQNpnVAW5iGQLVaHoKZqFmUAbSGBp5XHNJtJ4ItQHUYFYGyYxqCK9QjkoZh22NPNYHsNKvVAGskXEe4pnuOFbFw2AgysMqKp64FpuqCw6iiSgZjmLVR1FQDH1mPUMAtJZ6q9RqDAu4DfUebgDQGR6AB5FPBV6US9SgkKix9zNfSB3soL6-104GgNKSwgKupJbtgR7w1Ynh4VQ9C-yLf1uG0-cooRhHYXhBRKEyEpMWe-7uBxMSJKkj1fH+3x2Ri0HyBwUsnxoCsX1musmxbaKgOY7JcLJLJDQQD01kLMZ3jwGhuCK5bGFWwMMABXhNjxhQutuWKJSBaVKbVI4vwMOUiiyJB4rABMsHywE4GwAgcA6yQn2gbj6FmRJdbGqZLEWj2do6zF4mD1Ixnt7IfqiJSqeKJA4fJi3lNMU9JsxR4XiPYiVTVewvsjr2iyQ2004dzMs4RD8o4UTFINLs929PO1YnpqoaQAZgADkZflGS5AAmAeABZ+QANgAdg9SgeZF5tp4ntMG+sTDm6rmgAKAvfvZoMyecYtYYbOIzgvoghTegDsYiAqVKCwK55SUNAIJPMuNX0GgyZdb2EoLaCiIQEZAA). The function a rule returns gets `(value, allValues, outputArr)`: push a value to `outputArr` to change the output. `validator.registerRules()` and `validator.registerAliasedRule()` register rules for one validator, and rules of `AsyncValidator` (`livr/async`) can return a promise.

More: the [custom rules guide](https://js.livr-spec.org/guide/custom-rules), types of rules with arguments, meta rules and rule packages in the [TypeScript guide](https://js.livr-spec.org/typescript#custom-rules-type-inference), and [strict mode](https://js.livr-spec.org/typescript#strict-mode), which makes a misspelled rule or a rule without a type a compile error. In the package: `docs/guide/custom-rules.md` and `docs/TYPESCRIPT.md`.

---

## Built-in Rules

`livr` implements LIVR 2.0 and LIVR 2.5: every rule of both versions is built in.

| Category | Rules |
|----------|-------|
| **Common** | [required](http://livr-spec.org/validation-rules/common-rules.html#required) &#183; [not_empty](http://livr-spec.org/validation-rules/common-rules.html#not-empty) &#183; [not_empty_list](http://livr-spec.org/validation-rules/common-rules.html#not-empty-list) &#183; [any_object](http://livr-spec.org/validation-rules/common-rules.html#any-object) |
| **String** | [string](http://livr-spec.org/validation-rules/string-rules.html#string) &#183; [eq](http://livr-spec.org/validation-rules/string-rules.html#eq) &#183; [one_of](http://livr-spec.org/validation-rules/string-rules.html#one-of) &#183; [max_length](http://livr-spec.org/validation-rules/string-rules.html#max-length) &#183; [min_length](http://livr-spec.org/validation-rules/string-rules.html#min-length) &#183; [length_between](http://livr-spec.org/validation-rules/string-rules.html#length-between) &#183; [length_equal](http://livr-spec.org/validation-rules/string-rules.html#length-equal) &#183; [like](http://livr-spec.org/validation-rules/string-rules.html#like) |
| **Numeric** | [integer](http://livr-spec.org/validation-rules/numeric-rules.html#integer) &#183; [positive_integer](http://livr-spec.org/validation-rules/numeric-rules.html#positive-integer) &#183; [decimal](http://livr-spec.org/validation-rules/numeric-rules.html#decimal) &#183; [positive_decimal](http://livr-spec.org/validation-rules/numeric-rules.html#positive-decimal) &#183; [max_number](http://livr-spec.org/validation-rules/numeric-rules.html#max-number) &#183; [min_number](http://livr-spec.org/validation-rules/numeric-rules.html#min-number) &#183; [number_between](http://livr-spec.org/validation-rules/numeric-rules.html#number-between) |
| **Special** | [email](http://livr-spec.org/validation-rules/special-rules.html#email) &#183; [url](http://livr-spec.org/validation-rules/special-rules.html#url) &#183; [iso_date](http://livr-spec.org/validation-rules/special-rules.html#iso-date) &#183; [equal_to_field](http://livr-spec.org/validation-rules/special-rules.html#equal-to-field) |
| **Meta** | [nested_object](http://livr-spec.org/validation-rules/metarules.html#nested-object) &#183; [variable_object](http://livr-spec.org/validation-rules/metarules.html#variable-object) &#183; [list_of](http://livr-spec.org/validation-rules/metarules.html#list-of) &#183; [list_of_objects](http://livr-spec.org/validation-rules/metarules.html#list-of-objects) &#183; [list_of_different_objects](http://livr-spec.org/validation-rules/metarules.html#list-of-different-objects) &#183; [or](http://livr-spec.org/validation-rules/metarules.html#or) |
| **Modifiers** | [trim](http://livr-spec.org/validation-rules/modifiers.html#trim) &#183; [to_lc](http://livr-spec.org/validation-rules/modifiers.html#to-lc) &#183; [to_uc](http://livr-spec.org/validation-rules/modifiers.html#to-uc) &#183; [remove](http://livr-spec.org/validation-rules/modifiers.html#remove) &#183; [leave_only](http://livr-spec.org/validation-rules/modifiers.html#leave-only) &#183; [default](http://livr-spec.org/validation-rules/modifiers.html#default) |
| **LIVR 2.5** | [boolean](https://livr-spec.org/validation-rules/boolean.html) &#183; [not_one_of](https://livr-spec.org/validation-rules/not_one_of.html) &#183; [digits](https://livr-spec.org/validation-rules/digits.html) &#183; [starts_with](https://livr-spec.org/validation-rules/starts_with.html) &#183; [ends_with](https://livr-spec.org/validation-rules/ends_with.html) &#183; [contains](https://livr-spec.org/validation-rules/contains.html) &#183; [max_decimals](https://livr-spec.org/validation-rules/max_decimals.html) &#183; [iso_datetime](https://livr-spec.org/validation-rules/iso_datetime.html) &#183; [iso_time](https://livr-spec.org/validation-rules/iso_time.html) &#183; [required_if](https://livr-spec.org/validation-rules/required_if.html) &#183; [when](https://livr-spec.org/validation-rules/when.html) &#183; [values](https://livr-spec.org/validation-rules/values.html) &#183; [keys](https://livr-spec.org/validation-rules/keys.html) &#183; [any](https://livr-spec.org/validation-rules/any.html) &#183; [list_length](https://livr-spec.org/validation-rules/list_length.html) &#183; [unique](https://livr-spec.org/validation-rules/unique.html) &#183; [split](https://livr-spec.org/validation-rules/split.html) &#183; [uuid](https://livr-spec.org/validation-rules/uuid.html) &#183; [ip](https://livr-spec.org/validation-rules/ip.html) &#183; [cidr](https://livr-spec.org/validation-rules/cidr.html) &#183; [hostname](https://livr-spec.org/validation-rules/hostname.html) &#183; [base64](https://livr-spec.org/validation-rules/base64.html) &#183; [hex](https://livr-spec.org/validation-rules/hex.html) &#183; [digest](https://livr-spec.org/validation-rules/digest.html) &#183; [mongo_id](https://livr-spec.org/validation-rules/mongo_id.html) &#183; [hex_color](https://livr-spec.org/validation-rules/hex_color.html) &#183; [mac](https://livr-spec.org/validation-rules/mac.html) &#183; [e164](https://livr-spec.org/validation-rules/e164.html) &#183; [semver](https://livr-spec.org/validation-rules/semver.html) &#183; [jwt](https://livr-spec.org/validation-rules/jwt.html) &#183; [luhn](https://livr-spec.org/validation-rules/luhn.html) &#183; [credit_card](https://livr-spec.org/validation-rules/credit_card.html) &#183; [iban](https://livr-spec.org/validation-rules/iban.html), and [iso_date](https://livr-spec.org/validation-rules/iso_date.html) with `{ min, max }` |

The **LIVR 2.5** rules were added in LIVR 2.5, see the [LIVR 2.5 specification](https://github.com/koorchik/LIVR/blob/master/drafts/v2.5.md) and the [rules](https://livr-spec.org/validation-rules.html). They are loaded on first use. See [the list with their types](https://js.livr-spec.org/rules#livr-25-rules).

> **Need more rules?** Check out [livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules) for additional validators.

---

## Contributing

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/koorchik/js-validator-livr/issues). The documentation site is built from [`docs/`](docs).

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Author

**Viktor Turskyi** ([@koorchik](https://github.com/koorchik))

### Contributors

- eNdiD
