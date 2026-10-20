# TypeScript Type Inference

LIVR provides powerful TypeScript type inference that automatically derives types from your validation schemas. This gives you type safety without manually defining interfaces that duplicate your validation rules.

Try it without installing anything: [open an example in the TypeScript Playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAGQJIDUBKcBmUIjgcgBtgA3KfAbgChRJY4YBPMAUzgG84kA7TFqAGI4QAZQDGACxYgAhnAC+WYQWJkA9E1YBnSlSpq1cAIKJUGLZOlzgWuGEIzg3OABMZMGQDo4AAxm2xCG4tGB84QhYYWwAVZhZxKGAweCc+KCVcOGAYKkDg+AspWTgAXg4qODgrYEIALjgAbXwoFgBHAFdgFpd8ABoCasJ8AF1eirgcCPrOIJYAfQhMeqaZFxAnPoJ2rX4RhTHK1ZcWrS1p8cruFhCWFwWAIwArFjEYc8qPuDFsxmXmts63U2+BCiW4AHMRgdPnAAF5Jer4SBabKkeZOGAscG7aGVeTQ-HjDzgs4ccI2GALJYEUFOSH7KiKfxfIIhaj6QwACQgJH4cAAqjt0jAIHAdmwYFIsrx+N0GHEqJo2IK+WUeGkhLhxEUZAAeJWLMWWWQAPnZeRCcBIMmIbhF6TKVwA7qZ0J4UDbgHboLqVVATQAKQpWACU1At8G2qqtnu9UE81tt7hYAc4g0RMm43AAAiwAB4ycARTyBECbSYsDNrDb9YmkpqPHTDBRhvTATBwANRqAh8qVbueI4nLQAfhLPwocAMYpgYPBcAAPnB2twXCxME5boyqoQdn2WcEIMXCBBwQHE173NBPNiYABRKA4KBaAMh1vyKhAA) and hover over the types.

## Table of Contents

- [Basic Usage](#basic-usage)
  - [Async Validator](#async-validator)
- [How Types Are Inferred](#how-types-are-inferred)
  - [Required vs Optional Fields](#required-vs-optional-fields)
  - [Types of the Built-in Rules](#types-of-the-built-in-rules)
  - [Literal Types](#literal-types-with-one_of-and-eq)
  - [Rules Keep Literal Types](#rules-keep-literal-types)
  - [Type Widening with `default`](#type-widening-with-default)
- [Complex Schemas](#complex-schemas)
  - [Nested Objects](#nested-objects)
  - [Lists](#lists)
  - [Discriminated Unions](#discriminated-unions)
  - [Union Types](#union-types-with-or)
- [Custom Rules Type Inference](#custom-rules-type-inference)
  - [Rules with a Fixed Type](#rules-with-a-fixed-type)
  - [Rules That Make the Field Required](#rules-that-make-the-field-required)
  - [Types from Arguments and Earlier Rules](#types-from-arguments-and-earlier-rules)
  - [Meta Rules](#meta-rules)
  - [Aliases](#aliases)
  - [Replacing Built-in Rules](#replacing-built-in-rules)
  - [Rule Packages](#rule-packages)
- [Strict Mode](#strict-mode)
- [Migrating from RuleTypeDef](#migrating-from-ruletypedef)
- [Limitations](#limitations)
- [Available Type Exports](#available-type-exports)

---

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

// Validate data from external source (API request, form submission, etc.)
const input = getUserInput();
const result = validator.validate(input);

if (result) {
  // result is typed as User
  console.log(result.name); // string
  console.log(result.age);  // number | undefined
}
```

> **Important:** Always use `as const` after your schema definition to preserve literal types and enable proper inference.

### Async Validator

`AsyncValidator` of `livr/async` takes the same schemas and types, `validate()` returns a promise of the type:

```typescript
import LIVR from 'livr/async';
import type { InferFromSchema } from 'livr/types';

const userSchema = {
  username: ['required', 'string', 'unique_username'], // a custom async rule
  age: 'positive_integer',
} as const;

type User = InferFromSchema<typeof userSchema>;
const validator = new LIVR.AsyncValidator<User>(userSchema, { autoTrim: true });

try {
  const user = await validator.validate(input); // User
} catch (errors) {
  // The errors object, or 'FORMAT_ERROR' when the input is not an object
}
```

A custom rule has a type in `RuleTypes`, the type of the value after the rule, whether it returns a promise or not: `unique_username: As<string>` (see [Custom Rules Type Inference](#custom-rules-type-inference)). Its function may return a promise of the error code.

---

## How Types Are Inferred

Every rule of a field has a type: the type of the value after the rule. The rules run in order, and each one gets the value of the previous one, so the type of the field is the type after its last rule.

### Required vs Optional Fields

By default, all fields are **optional**. Use the `required` rule to make a field mandatory. Its place in the list does not matter:

```typescript
const schema = {
  requiredField: ['required', 'string'],  // string (required)
  alsoRequired: ['string', 'required'],   // string (required)
  optionalField: 'string',                // string | undefined (optional)
} as const;

type Data = InferFromSchema<typeof schema>;
// { requiredField: string; alsoRequired: string; optionalField?: string }
```

The `default` rule also makes fields non-optional since they always have a value, and so does `not_empty_list`, which returns an error for a missing list:

```typescript
const schema = {
  count: [{ default: 0 }, 'integer'],     // number (has default)
  enabled: { default: true },              // boolean (has default, widened)
  tags: ['not_empty_list', { list_of: 'string' }], // string[] (required)
} as const;

type Config = InferFromSchema<typeof schema>;
// { count: number; enabled: boolean; tags: string[] }
```

### Types of the Built-in Rules

| Rule | Inferred Type |
|------|---------------|
| `string` | `string` |
| `integer`, `positive_integer` | `number` |
| `decimal`, `positive_decimal` | `number` |
| `max_number`, `min_number`, `number_between` | `number` |
| `max_length`, `min_length`, `length_equal`, `length_between`, `like` | `string` |
| `email`, `url`, `iso_date` | `string` |
| `trim`, `remove`, `leave_only` | `string` |
| `to_lc`, `to_uc` | `string`, literal types in lower or upper case |
| `any_object` | `Record<string, unknown>` |
| `not_empty`, `equal_to_field` | the type of earlier rules, `string` as the first rule |
| `not_empty_list` | the list type of earlier rules or `unknown[]`, the field is required |
| `required` | the type of earlier rules, the field is required |
| `eq`, `one_of` | the literal types of the allowed values |
| `default` | the type of the default value, the field is required |

Numeric rules accept strings like `'42'` and return numbers, and string rules return numbers as strings, so `['integer', { max_length: 3 }]` is a `string`. The [built-in rules page](./rules.md) has the whole list.

### Literal Types with `one_of` and `eq`

To get literal union types, use `as const` on the schema (or on the values array):

```typescript
const schema = {
  // Without as const: string
  // With as const: 'admin' | 'user' | 'guest'
  role: { one_of: ['admin', 'user', 'guest'] },

  // The values can also be in an array, the way the LIVR specification writes them
  plan: { one_of: [['free', 'pro']] },

  // Literal type: 'active'
  status: { eq: 'active' },
} as const;

type Data = InferFromSchema<typeof schema>;
// { role?: 'admin' | 'user' | 'guest'; plan?: 'free' | 'pro'; status?: 'active' }
```

### Rules Keep Literal Types

Rules that only check a value, or convert it to their type, keep a more precise type of earlier rules. A literal union stays a literal union after length checks, `string`, `email` and other string rules, and number literals stay after numeric rules:

```typescript
const schema = {
  role: ['required', { one_of: ['admin', 'user'] }, { max_length: 10 }],
  level: [{ one_of: [1, 2, 3] }, 'positive_integer'],
  code: [{ one_of: ['USD', 'EUR'] }, 'to_lc'],
  name: [{ one_of: [' a', 'b '] }, 'trim'],
} as const;

type Data = InferFromSchema<typeof schema>;
// {
//     role: 'admin' | 'user';
//     level?: 1 | 2 | 3;
//     code?: 'usd' | 'eur';
//     name?: string; // trim makes a new string
// }
```

### Type Widening with `default`

The `default` rule automatically widens literal types to their primitive base:

```typescript
const schema = {
  // Widens to primitive types
  count: { default: 0 },           // number (not 0)
  name: { default: 'anonymous' },  // string (not 'anonymous')
  active: { default: true },       // boolean (not true)

  // Use type assertions with unions to preserve specific types
  status: { default: 'ACTIVE' as 'ACTIVE' | 'PENDING' },  // 'ACTIVE' | 'PENDING'

  // After other rules, the type of the rules and of the default value
  role: [{ one_of: ['admin', 'user'] }, { default: 'user' }], // 'admin' | 'user'
} as const;

type Config = InferFromSchema<typeof schema>;
// {
//     count: number;
//     name: string;
//     active: boolean;
//     status: 'ACTIVE' | 'PENDING';
//     role: 'admin' | 'user';
// }
```

This is useful because default values typically represent any value of that type, not just the specific default. Use type assertions with union types (`as 'A' | 'B'`) when you need a specific set of allowed values.

---

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
          type: { eq: 'click' },
          x: ['required', 'integer'],
          y: ['required', 'integer'],
        },
        scroll: {
          type: { eq: 'scroll' },
          direction: { one_of: ['up', 'down'] },
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

`variable_object` works the same way for a single object. The output has only the fields of the schema of the selector value, so list the discriminator field in each schema (`type: 'required'` is enough) to have it in the output and in the type.

### Union Types with `or`

```typescript
const schema = {
  // Can be either a string or a number
  value: { or: ['string', 'integer'] },

  // Required when every set of rules has required
  id: { or: [['required', 'positive_integer'], ['required', { like: '^[a-z]+$' }]] },
} as const;

type Data = InferFromSchema<typeof schema>;
// { value?: string | number; id: number | string }
```

---

## Custom Rules Type Inference

Types of your rules, aliases and rule packages go to the `RuleTypes` interface of `livr/types/inference`, by declaration merging. Every package adds its own rules, so any number of packages can be used together. camelCase names are found automatically: `my_rule` is also typed as `myRule`, the way the validator registers it.

The type of a rule is the type of the value after the rule. The built-in rules are declared the same way, each next to its code in `lib/rules` of the package: `lib/rules/string/max_length.js` and `lib/rules/string/max_length.d.ts`.

### Rules with a Fixed Type

```typescript
// my-rules.d.ts, or any .ts file of your project
import type { As } from 'livr/types/inference';

declare module 'livr/types/inference' {
  interface RuleTypes {
    uuid: As<string>; // checks a string
    to_date: Date;    // converts the value to a Date
  }
}
```

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

LIVR.Validator.registerDefaultRules({ uuid, to_date });

const schema = {
  id: ['required', 'uuid'],
  createdAt: ['required', 'toDate'],
} as const;

type Entity = InferFromSchema<typeof schema>;
// { id: string; createdAt: Date }
```

Use `As<T>` for a rule that checks a value or converts it to `T`: it keeps a more precise `T` of earlier rules. Use the type itself for a rule that makes a new value:

| Type of the rule | For | Type of `[{ one_of: ['a', 'b'] }, 'my_rule']` |
| --- | --- | --- |
| `As<string>` | rules that check a string, or convert a value to a string | `'a' \| 'b'` |
| `string` | rules that make a new string, like `trim` | `string` |
| `As<unknown>` | rules that check a value of any type | `'a' \| 'b'` |
| `As<unknown[]>` | rules that check a list | the list type of earlier rules, or `unknown[]` |

### Rules That Make the Field Required

When the field is always in the output after the rule, like with `required` and `default`, the field is not optional. Use `Present<T>` for a rule that always gives `T`, or set `present: true` in an interface that extends `RuleType` (see [the next section](#types-from-arguments-and-earlier-rules)):

```typescript
import type { Present, RuleType } from 'livr/types/inference';

// Like `required`, also for a whitespace-only value: the type of earlier rules is kept
interface NotBlankType extends RuleType {
  output: this['input'];
  present: true;
}

declare module 'livr/types/inference' {
  interface RuleTypes {
    default_now: Present<Date>; // sets the current date when the value is empty
    not_blank: NotBlankType;
  }
}

const schema = {
  updatedAt: 'default_now',
  title: ['string', 'not_blank'],
} as const;

type Data = InferFromSchema<typeof schema>; // { updatedAt: Date; title: string }
```

`present` is a flag next to `output`, and not a part of it, so that types of nested objects are computed only when they are used. That keeps deeply nested schemas within the limits of TypeScript.

### Types from Arguments and Earlier Rules

When the type depends on the rule arguments or on the type before the rule, declare an interface that extends `RuleType`, and compute its `output` from:

- `this['args']`: the arguments, as the rule function gets them;
- `this['input']`: the type before the rule, `unknown` for the first rule.

Set `present: true` when the rule makes the field always present, or compute it from the arguments, like `present: this['args'][0] extends true ? true : false`.

| Rule in a schema | The rule function gets | `this['args']` |
| --- | --- | --- |
| `'my_rule'` | `my_rule(ruleBuilders)` | `[]` |
| `{ my_rule: 'a' }` | `my_rule('a', ruleBuilders)` | `['a']` |
| `{ my_rule: [1, 10] }` | `my_rule(1, 10, ruleBuilders)` | `[1, 10]` |
| `{ my_rule: [['a', 'b']] }` | `my_rule(['a', 'b'], ruleBuilders)` | `[['a', 'b']]` |

```typescript
import type { RuleType } from 'livr/types/inference';

// { currency: ['USD', 'EUR'] } -> 'USD' | 'EUR'
interface CurrencyType extends RuleType {
  output: this['args'][number];
}

// { instance_of: Date } -> Date
interface InstanceOfType extends RuleType {
  output: this['args'][0] extends abstract new (...args: any) => infer T ? T : unknown;
}

// 'to_list': a list of the value, or the list itself
interface ToListType extends RuleType {
  output: this['input'] extends readonly unknown[] ? this['input'] : Array<this['input']>;
}

declare module 'livr/types/inference' {
  interface RuleTypes {
    currency: CurrencyType;
    instance_of: InstanceOfType;
    to_list: ToListType;
  }
}

const schema = {
  price: ['required', { currency: ['USD', 'EUR'] }],
  createdAt: { instance_of: Date },
  ids: ['positive_integer', 'to_list'],
} as const;

type Data = InferFromSchema<typeof schema>;
// { price: 'USD' | 'EUR'; createdAt?: Date; ids?: number[] }
```

Two things to know when you write such types:

- Read the arguments by index, `this['args'][0]` or `this['args'][number]`. Inside the interface they are an intersection with `readonly unknown[]`, so `this['args'] extends [infer First, ...infer Rest]` gives wrong types.
- `this` is not allowed in an object type literal: instead of `output: { currency: this['args'][0] }`, declare `interface Money<C> { amount: number; currency: C }` and set `output: Money<this['args'][0]>`.

### Meta Rules

Meta rules validate their value with other rules, and their types are built from the types of those rules:

- `InferFromSchema<Schema>`: the type of an object validated by a schema, like `nested_object`;
- `InferRuleType<Rules>`: the type of a value after a rule or a list of rules, like the items of `list_of`. `InferRuleType<Rules, this['input']>` applies the rules to the value of your rule, like a set of rules of `or`;
- `MakesPresent<Rules, Input>`: `true` when the rules make the field present, for `present` of such a rule.

```typescript
import type { RuleType, InferRuleType, LIVRRuleDefinition } from 'livr/types/inference';

// { dict_of: 'positive_integer' } or { dict_of: ['required', 'string'] }
//   -> Record<string, number>, Record<string, string>
interface DictOfType extends RuleType {
  params: readonly LIVRRuleDefinition[];
  output: Record<string, InferRuleType<this['args']>>;
}

declare module 'livr/types/inference' {
  interface RuleTypes {
    dict_of: DictOfType;
  }
}
```

`params` are the types of the arguments, a tuple like `this['args']`: [strict mode](#strict-mode) checks the rules in the arguments with it. A single argument can also be written without the array, like `{ dict_of: 'string' }`. Without `params`, the arguments are not checked.

The built-in meta rules are written this way, see `lib/rules/meta/*.d.ts` in the package.

### Aliases

The type of an alias is the type of its rules written in place, `AliasType<typeof rules>`. Keep the rules in a constant with `as const`, and pass it both to the validator and to the type:

```typescript
import type { AliasType } from 'livr/types/inference';

const phoneRules = ['string', { like: '^\\+?[0-9]{10,15}$' }] as const;
const requiredPhoneRules = ['required', 'phone'] as const;

LIVR.Validator.registerAliasedDefaultRule({ name: 'phone', rules: phoneRules, error: 'WRONG_PHONE' });
LIVR.Validator.registerAliasedDefaultRule({ name: 'required_phone', rules: requiredPhoneRules });

declare module 'livr/types/inference' {
  interface RuleTypes {
    phone: AliasType<typeof phoneRules>;
    required_phone: AliasType<typeof requiredPhoneRules>;
  }
}

const schema = {
  phone: 'phone',
  backupPhone: 'requiredPhone',
} as const;

type Contact = InferFromSchema<typeof schema>;
// { phone?: string; backupPhone: string }
```

An alias gets the type of earlier rules, like its rules would, and `required` in an alias makes the field required. Aliases of one validator (`validator.registerAliasedRule()`) and its own rules (`validator.registerRules()`) are typed the same way: rule types are global.

The type is not added by `registerAliasedDefaultRule()`: an alias without a type in `RuleTypes` gives `unknown`. [Strict mode](#strict-mode) makes it a compile error. The order of the call and the declaration does not matter, TypeScript reads all declarations first.

### Replacing Built-in Rules

`registerDefaultRules()` and `registerAliasedDefaultRule()` can replace a built-in rule. A type in `RuleTypes` replaces the type of the built-in rule with the same name in the same way:

```typescript
// Prices stay strings with two decimals
const priceRules = ['string', { like: '^\\d+\\.\\d{2}$' }] as const;
LIVR.Validator.registerAliasedDefaultRule({ name: 'decimal', rules: priceRules });

declare module 'livr/types/inference' {
  interface RuleTypes {
    decimal: AliasType<typeof priceRules>; // string instead of number
  }
}
```

The types of the built-in rules are in `BuiltInRuleTypes`. Reuse them for your rules, like `my_enum: BuiltInRuleTypes['one_of']`.

### Rule Packages

A package with LIVR rules declares their types the same way, in a `.d.ts` file that its types entry loads, so the types come with `import 'my-livr-rules'`. Put the type of each rule next to its code (`rules/uuid.js` and `rules/uuid.d.ts`), or all of them in one file:

```typescript
// my-livr-rules/types/index.d.ts
import type { As, RuleType } from 'livr/types/inference';

// { is: 'active' } -> 'active', the field is required
interface IsType extends RuleType {
  output: this['args'][0];
  present: true;
}

declare module 'livr/types/inference' {
  interface RuleTypes {
    uuid: As<string>;
    boolean: boolean;
    list_length: As<unknown[]>;
    is: IsType;
  }
}

type RuleFactory = (
  ...args: Array<any>
) => (value: any, params: any, outputArr: Array<any>) => string | undefined;

declare const rules: Record<string, RuleFactory>;
// At the top level: inside `declare module 'my-livr-rules'` in this file it would be
// a module augmentation, where exports are not allowed (TS2666 without skipLibCheck)
export = rules;
```

- List `livr` in `peerDependencies`, so that the package and the application use the same `livr/types/inference`.
- Rule names are global. Two packages may declare the same rule with the same type. With different types, TypeScript reports TS2717 (`Subsequent property declarations must have the same type`); with `skipLibCheck` the error in a package is hidden and the first declaration wins.
- Check the package in a project that installs it (`npm pack`), with and without `skipLibCheck`.

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';
import myRules from 'my-livr-rules'; // the rules and their types

LIVR.Validator.registerDefaultRules(myRules);

const schema = {
  id: ['required', 'uuid'],
  status: { is: 'active' },
} as const;

type Item = InferFromSchema<typeof schema>;
// { id: string; status: 'active' }
```

## Strict Mode

A rule without a type gives `unknown`, with no error: a misspelled rule, or a custom rule or an alias whose type was forgotten. Strict mode makes it a compile error. Turn it on once in the application:

```typescript
// livr-options.d.ts, or any .ts file of your project. The file must be a module:
// with an import or an export, else it declares a new module instead of adding to livr
export {};

declare module 'livr/types/inference' {
  interface TypeOptions {
    strictRules: true;
  }
}
```

Then every rule must have a type: a built-in rule, a type in `RuleTypes`, or a rule of a package with types. TypeScript checks:

- schemas passed to `new LIVR.Validator()`, also the rules inside meta rules, like `nested_object`, `list_of` and `or`;
- schemas with `satisfies LIVRSchema`;
- the names and the rules of aliases, `registerAliasedDefaultRule()` and `registerAliasedRule()`;
- the names of rules in `registerDefaultRules()` and `registerRules()`, when the object is written in place. Rules of a package typed as `Record<string, RuleFactory>` are not checked there, their types are.

```typescript
const schema = {
  name: ['required', 'strng'],
} as const;

new LIVR.Validator(schema);
// Type '"strng"' is not assignable to type 'StrictRule'. Did you mean '"string"'?

LIVR.Validator.registerAliasedDefaultRule({ name: 'phone', rules: phoneRules });
// Type '"phone"' is not assignable to type 'RuleName', until RuleTypes has `phone`
```

With `as const satisfies LIVRSchema` the error is shown at the rule, not at the validator:

```typescript
import type { LIVRSchema } from 'livr/types';

const schema = {
  name: ['required', 'strng'], // Did you mean '"string"'?
} as const satisfies LIVRSchema;
```

Strict mode does not change the inferred types. It also checks the arguments of meta rules, `{ nested_object: 'string' }` is an error, by `params` of their types (see [Meta Rules](#meta-rules)). The arguments of other rules are not checked.

- **A schema without `as const`** has `string` instead of the rule names, every rule is reported. Inference needs `as const` anyway.
- **A schema from JSON or built at runtime** is not checked: `new LIVR.Validator<Type>(schema as LIVRSchema)`.
- **Deep schemas.** TypeScript compares types to about 100 levels, so strict mode checks up to 16 levels of nested meta rules, like `nested_object` in `nested_object` (8 levels of `or` with `nested_object` in it). A deeper schema gets `Excessive stack depth comparing types`: pass it `as LIVRSchema`. Inference works deeper.
- `RuleName` is the union of the names of the rules with a type.

---

## Migrating from RuleTypeDef

Earlier versions declared rule types with `RuleTypeDef` in `RuleTypeRegistry` and with templates in `ParameterizedRuleRegistry`. These declarations still work, so packages and projects can move to `RuleTypes` when they like. They are deprecated (editors show them struck through) and will be removed in the next major version.

| Before | After |
| --- | --- |
| `interface RuleTypeRegistry { ... }` | `interface RuleTypes { ... }` |
| `my_rule: RuleTypeDef<string, false, false>` | `my_rule: As<string>` when the rule checks or converts to a string, `my_rule: string` when it makes a new string |
| `myRule: RuleTypeRegistry['my_rule']` | remove: camelCase names are found automatically |
| `RuleTypeDef<T, true, false>`, `DefaultRule<T>`, `RuleTypeDef<T, false, true>` | `Present<T>` |
| `RequiredRule` | an interface with `output: this['input']` and `present: true` |
| `RuleTypeDef<unknown, false, false>` for a rule that only checks the value | `As<unknown>`, or `As<unknown[]>` for a list. The field keeps its type now: before, it became `unknown` |
| `ParameterizedRuleDef<'literal'>` | an interface with `output: this['args'][0]` |
| `ParameterizedRuleDef<'array_element'>` | `BuiltInRuleTypes['one_of']` |
| `ParameterizedRuleDef<'infer_schema'>` | an interface with `output: InferFromSchema<this['args'][0]>` |
| `ParameterizedRuleDef<'infer_schema_array'>` | an interface with `output: Array<InferFromSchema<this['args'][0]>>` |
| `ParameterizedRuleDef<'infer_rule_array'>` | `BuiltInRuleTypes['list_of']` |
| A template in `TemplateOutputRegistry<Args>` | an interface with the template as `output`, `this['args'][0]` instead of `Args` |
| `RuleTypeRegistry['email']` (types of built-in rules) | `BuiltInRuleTypes['email']` |

Templates got the arguments as they are written in the schema, `this['args']` has them as the rule function gets them. They differ only for an array: `{ my_rule: ['a'] }` gave `['a']` to a template, and `this['args'][0]` is `'a'`, like the first argument of the rule function.

A package with both registries, before and after:

```typescript
// Before
import type { RuleTypeDef, ParameterizedRuleDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
  interface TemplateOutputRegistry<Args> {
    instance_of: Args extends abstract new (...args: any) => any ? InstanceType<Args> : unknown;
  }

  interface RuleTypeRegistry {
    uuid: RuleTypeDef<string, false, false>;
    credit_card: RuleTypeDef<string, false, false>;
    creditCard: RuleTypeRegistry['credit_card'];
    boolean: RuleTypeDef<boolean, false, false>;
    list_length: RuleTypeDef<unknown, false, false>;
    listLength: RuleTypeRegistry['list_length'];
  }

  interface ParameterizedRuleRegistry {
    is: ParameterizedRuleDef<'literal', true, false>;
    instance_of: ParameterizedRuleDef<'instance_of', false, false>;
    instanceOf: ParameterizedRuleDef<'instance_of', false, false>;
  }
}
```

```typescript
// After
import type { As, RuleType } from 'livr/types/inference';

interface IsType extends RuleType {
  output: this['args'][0];
  present: true;
}

interface InstanceOfType extends RuleType {
  output: this['args'][0] extends abstract new (...args: any) => infer T ? T : unknown;
}

declare module 'livr/types/inference' {
  interface RuleTypes {
    uuid: As<string>;
    credit_card: As<string>;
    boolean: boolean;
    list_length: As<unknown[]>;
    is: IsType;
    instance_of: InstanceOfType;
  }
}
```

Types of the built-in rules changed in the same version. They follow the runtime more closely, so some fields get more precise types, see the [changelog](https://js.livr-spec.org/changelog).

---

## Limitations

- **`as const` is needed.** Without it, a list of rules is a `string[]`, and its type is `unknown`.
- **Rule names are checked only in [strict mode](#strict-mode).** Otherwise a misspelled rule, or a rule without a declared type, gives `unknown`, as the type of a value after it is not known.
- **Empty values.** Rules skip empty values (`null` and `''`) of optional fields, and the value stays in the output as it is: `{ age: 'integer' }` with the input `{ age: '' }` gives `{ age: '' }`, but the type is `{ age?: number }`. The same holds for items of `list_of` without `required`. Use `required` or `default` where the type must hold for such input.
- **Schemas built at runtime** have no compile-time type. Declare the type of the output where you load the schema, and pass it to `new LIVR.Validator<Type>(schema)`.
- **TypeScript 5.0 or newer.**

---

## Available Type Exports

```typescript
import type {
  // Main inference type
  InferFromSchema,

  // Infer type from a single rule (useful for list elements)
  InferRuleType,

  // true when rules make the field present, for meta rules
  MakesPresent,

  // Schema and rule definition types
  LIVRSchema,
  LIVRRuleDefinition,
  LIVRPrimitive,

  // Types of rules: add yours to RuleTypes in 'livr/types/inference'
  RuleTypes,
  BuiltInRuleTypes,
  RuleName,
  RuleType,
  As,
  Present,
  AliasType,

  // Utility types
  Simplify,
} from 'livr/types';
```

`TypeOptions` turns on [strict mode](#strict-mode), add `strictRules: true` to it in `livr/types/inference`.

`livr/types/inference` exports the same types, and it is the module to add rule types to. The deprecated `RuleTypeDef`, `RuleTypeRegistry`, `ParameterizedRuleDef`, `ParameterizedRuleRegistry`, `SimpleRule`, `RequiredRule`, `ParameterizedRule` and `DefaultRule` are still exported, see [Migrating from RuleTypeDef](#migrating-from-ruletypedef).
