---
title: Type inference
description: TypeScript infers the type of the validated data from a LIVR schema, which is plain data. No second definition, no code generator.
---

# Type inference

A LIVR schema is plain data, and TypeScript still knows exactly what `validate()` returns. You describe the rules once, and the type of the validated data follows from them: there is no interface to write next to the schema and keep in sync, and no code generator to run.

> **Type safety without a second definition** is the priority → **types are inferred from the schema data** → schemas in code need `as const`, and a schema loaded at runtime gets its type from wherever you declare it

## One definition, two results

```ts
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const schema = {
  email: ['required', 'email'],
  role: { one_of: ['admin', 'user'] },
  address: {
    nested_object: {
      city: ['required', 'string'],
      zip: 'positive_integer',
    },
  },
  tags: { list_of: 'string' },
} as const;

type User = InferFromSchema<typeof schema>;
// {
//   email: string;
//   role?: 'admin' | 'user';
//   address?: { city: string; zip?: number };
//   tags?: string[];
// }

const validator = new LIVR.Validator<User>(schema);
const user = validator.validate(input); // User | false

if (user) {
  user.address?.city; // string | undefined
}
```

The same object is the validation rules at runtime and the source of the type at compile time. Change a rule, and the type changes with it. [Open this example in the TypeScript Playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAGQJIDUBKcBmUIjgcgBtgA3KfAbgChRJY4YBPMAUzgG84kA7TFqAGI4QAZQDGACxYgAhnAC+WYQWJkA9E1YBnSlSpq1cAIKJUGLZOlzgWuGEIzg3OABMZMGQDo4AAxm2xCG4tGB84QhYYWwAVZhZxKGAweCc+KCVcOGAYKkDg+AspWTgAXg4qODgrYEIALjgAbXwoFgBHAFdgFpd8ABoCasJ8AF1eirgcCPrOIJYAfQhMeqaZFxAnPoJ2rX4RhTHK1ZcWrS1p8cruFhCWFwWAIwArFjEYc8qPuDFsxmXmts63U2+BCiW4AHMRgdPnAAF5Jer4SBabKkeZOGAscG7aGVeTQ-HjDzgs4ccI2GALJYEUFOSH7KiKfxfIIhaj6QwACQgJH4cAAqjt0jAIHAdmwYFIsrx+N0GHEqJo2IK+WUeGkhLhxEUZAAeJWLMWWWQAPnZeRCcBIMmIbhF6TKVwA7qZ0J4UDbgHboLqVVATQAKQpWACU1At8G2qqtnu9UE81tt7hYAc4g0RMm43AAAiwAB4ycARTyBECbSYsDNrDb9YmkpqPHTDBRhvTATBwANRqAh8qVbueI4nLQAfhLPwocAMYpgYPBcAAPnB2twXCxME5boyqoQdn2WcEIMXCBBwQHE173NBPNiYABRKA4KBaAMh1vyKhAA) and hover over the types.

## What gets inferred

- **Required and optional fields.** Fields are optional unless they have `required` or `default`.
- **The type of every rule.** `email`, `string` and `like` give `string`, numeric rules give `number`, `list_of` gives an array, `nested_object` an object, `or` and `variable_object` a union.
- **Literal types.** `one_of: ['admin', 'user']` gives `'admin' | 'user'`, `eq: 'active'` gives `'active'`.
- **Defaults.** `{ default: 0 }` makes the field required and gives `number`.
- **Types through the rule list.** Rules that check a value keep the type of earlier rules: `[{ one_of: ['admin', 'user'] }, { max_length: 10 }]` stays `'admin' | 'user'`.
- **Aliases and your own rules,** once their type is declared, also when they replace a built-in rule.

The [built-in rules page](/rules) lists the type of every rule, and the [TypeScript guide](/typescript) has all the details.

## Your own rules are typed too

A custom rule declares its type once, by module augmentation, and every schema that uses it gets the right type:

```ts
import type { As } from 'livr/types/inference';

declare module 'livr/types/inference' {
  interface RuleTypes {
    to_date: Date; // converts the value to a Date
    uuid: As<string>; // checks a string
  }
}

const schema = {
  id: ['required', 'uuid'],
  created_at: ['required', 'to_date'],
} as const;

type Entity = InferFromSchema<typeof schema>; // { id: string; created_at: Date }
```

Rules whose type depends on their arguments, aliases, meta rules and rule packages like [livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules) work the same way, and any number of packages can add their rules. See [Custom rules type inference](/typescript#custom-rules-type-inference).

## Data and types together

Other validators make you choose: schemas as code with inferred types, or schemas as data without them.

| Validator | Schema is | Type of the validated data |
| --- | --- | --- |
| **LIVR** | **plain data** | **inferred from the schema (`InferFromSchema`)** |
| Zod | code | inferred (`z.infer`) |
| Valibot | code | inferred (`InferOutput`) |
| Ajv | JSON Schema or JTD data | inferred for JTD (`JTDDataType`); for JSON Schema you write the type, and Ajv checks the schema against it |
| Joi | code | not built in |
| fastest-validator | object with code generation | not built in |

With LIVR, the schema stays data that you can store, send and share with other languages, and TypeScript still types it.

## The trade-off

Inference needs the schema literal in your code, with `as const`. A schema that arrives at runtime, from a database or an API, has no compile-time type, as with any validator. Declare its output type where you load it, and pass it to `new LIVR.Validator<Type>(schema)`.

## More

- [TypeScript guide](/typescript)
- [Rules are just data](/why/schemas-are-data)
