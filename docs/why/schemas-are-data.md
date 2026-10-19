---
title: Rules are just data
description: A LIVR schema is a plain JSON structure. Store it in a database, share it across languages, and load it safely from untrusted sources.
---

# Rules are just data

A LIVR schema is a plain data structure: objects, arrays, strings and numbers. It contains no functions and no classes, and the validator never turns it into code. This is the decision everything else in LIVR follows from.

> **Portability and safety** are the priority → schemas are **pure JSON data** → no fluent API and no inline functions in a schema

## Data, not code

The same rules as LIVR data and as Zod code:

::: code-group

```js [LIVR]
const schema = {
  username: ['required', { min_length: 3 }, { max_length: 50 }],
  email: ['required', 'email'],
  role: { one_of: ['admin', 'user', 'guest'] },
};

// It is data: it survives JSON.stringify() and JSON.parse() unchanged
await db.saveSchema('user-registration', JSON.stringify(schema));

const loaded = JSON.parse(await db.getSchema('user-registration'));
const validator = new LIVR.Validator(loaded);
```

```ts [Zod]
const schema = z.object({
  username: z.string().min(3).max(50),
  email: z.email(),
  role: z.enum(['admin', 'user', 'guest']),
});

// It is code: a tree of class instances with methods.
// It cannot be saved to a database or sent to another service,
// and a Python or Go service cannot use it.
```

:::

Zod, Valibot and Joi build schemas from function calls. Zod and Valibot can export a JSON Schema for documentation, but the schema they validate with is still JavaScript code. fastest-validator and Ajv take schemas as objects, but compile them into JavaScript source, which is a problem of its own, see [below](#safe-with-untrusted-schemas).

## What you can do with data

**Keep rules outside the code.** Rules that change often, like limits per customer or fields of a form, can live in a database, a config file or a CMS, and change without a deploy:

```js
// Each tenant has its own limits, edited in an admin panel
const { schema } = await db.query('SELECT schema FROM validation_rules WHERE tenant_id = ?', [
  tenantId,
]);
const validator = new LIVR.Validator(JSON.parse(schema));
```

Creating a validator from such rules for every request costs less than a microsecond, and LIVR is the fastest validator in this case too: see [Rules built at runtime](/why/performance#rules-built-at-runtime).

**Embed rules in larger configurations.** A form builder can keep the UI and the validation of a field in one JSON document, an API gateway can keep the validation next to the route:

```json
{
  "route": "/api/users",
  "method": "POST",
  "auth": "jwt",
  "validation": {
    "email": ["required", "email"],
    "password": ["required", { "min_length": 8 }]
  }
}
```

**Use the same rules on every side.** Send the schema to the browser and validate a form before it is submitted, with exactly the rules and error codes of the server. If the server is written in Perl, PHP, Python, Go, Java, Ruby or Erlang, it uses the same schema through its [own implementation](https://livr-spec.org/introduction/implementations.html), and returns the same error codes. See [Proven](/why/proven) for how the specification keeps them in agreement.

**Generate and transform rules.** A schema is an object, so a program can build it, merge two of them, diff two versions or show them in a UI. No parser and no AST needed.

## Safe with untrusted schemas

Some validators get their speed by compiling a schema into JavaScript source and running it with `new Function()`. If a schema can come from outside, from a database, a tenant or an API, a value in it can become code. This happened to fastest-validator ([issue #326](https://github.com/icebob/fastest-validator/issues/326)):

```js
const Validator = require('fastest-validator');
const v = new Validator();

// The attacker controls the schema, for example through a database or an API
const check = v.compile({
  id: { type: 'number', max: 'console.log(process.env) || 999' },
});

check({ id: 123 }); // runs console.log(process.env)
```

LIVR treats every rule argument as data. The same attack does nothing:

```js
const validator = new LIVR.Validator({
  id: ['required', { max_number: 'console.log(process.env) || 999' }],
});

validator.validate({ id: 123 });
// { id: 123 }: the argument is only compared with the value, as a number. Nothing is executed
```

The worst a hostile schema can do is reject valid data or let invalid data through, which is the job of whoever controls the rules anyway. One thing to keep in mind: `like` takes a regular expression, and a crafted pattern can be very slow on some inputs (ReDoS). If end users write schemas, review or restrict their `like` patterns.

This matters for multi-tenant products where customers define their own rules, no-code tools and form builders, and any service that loads schemas from a database or another service.

## Your vocabulary, as data

Aliases combine rules under a domain name with a domain error code. An alias is data too, so a whole vocabulary can come from a config file:

```json
{
  "aliases": [
    { "name": "product_sku", "rules": ["required", { "like": "^[A-Z]{3}-\\d{6}$" }], "error": "WRONG_SKU" },
    { "name": "adult_age", "rules": ["positive_integer", { "min_number": 18 }], "error": "MUST_BE_ADULT" }
  ]
}
```

```js
const validator = new LIVR.Validator({ sku: 'product_sku', age: ['required', 'adult_age'] });
config.aliases.forEach(alias => validator.registerAliasedRule(alias));
```

## And still typed

For schemas in your code, add `as const` and TypeScript infers the type of the validated data from the data itself:

```ts
const schema = {
  email: ['required', 'email'],
  role: { one_of: ['admin', 'user'] },
} as const;

type User = InferFromSchema<typeof schema>; // { email: string; role?: 'admin' | 'user' }
```

A schema loaded at runtime has no compile-time type, as with any validator. Declare the type of its output where you load it. See the [TypeScript guide](/typescript).

## The trade-off

There is no fluent API, and a schema cannot hold an inline function such as `.refine(value => ...)`. Logic that rules cannot express goes into a named rule, registered in code: a [custom rule](/guide/custom-rules) of a few lines. The schema then refers to it by name and stays data.

## More

- [Design decision #1: Schemas as data](/why/design-decisions#design-decision-1-schemas-as-data-vs-schemas-as-code)
- [Design decision #2: No code generation](/why/design-decisions#design-decision-2-no-code-generation-security)
- [Design decision #7: Rules aliasing](/why/design-decisions#design-decision-7-rules-aliasing-with-custom-error-codes)
