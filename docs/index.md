---
layout: home
title: LIVR for JavaScript and TypeScript
titleTemplate: false

hero:
  name: LIVR
  text: Validation rules that are just data
  tagline: Keep rules in code or build them at runtime, LIVR is the fastest JavaScript validator either way. TypeScript types inferred from the schema. Zero dependencies. Built on a cross-language specification and maintained since 2013.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: All validation rules ↗︎
      link: https://livr-spec.org/validation-rules.html
    - theme: alt
      text: Why LIVR
      link: /why/schemas-are-data

features:
  - icon: 📄
    title: Rules are just data
    details: A schema is a plain JSON structure, not code. Store it in a database, send it over the wire, share it with services in other languages, and load it safely even from untrusted sources.
    link: /why/schemas-are-data
    linkText: Why data beats code
  - icon: ⚡
    title: Incredible performance
    details: The fastest in the benchmarks against Valibot, Zod, fastest-validator, Ajv and Joi. Also when rules are built at runtime, where it is tens to hundreds of times faster than Zod, fastest-validator and Ajv.
    link: /why/performance
    linkText: See the benchmarks
  - icon: 🔷
    title: Type inference
    details: TypeScript infers the type of the validated data from the schema itself, with required fields, literal unions, nested objects, lists and your own rules. No second definition to keep in sync.
    link: /why/type-inference
    linkText: How it works
  - icon: 📦
    title: Zero dependencies
    details: Nothing to audit but LIVR itself, no supply-chain risk, no version conflicts. About 2 KB for the core and 5 KB with every built-in rule, min+gzip.
    link: /why/zero-dependencies
    linkText: Why it matters
---

<div class="home-section">

<p class="home-pillar__eyebrow">Rules are just data</p>

## Your validation rules can live anywhere

Zod, Valibot and Joi schemas are JavaScript code, so they stay inside one JavaScript codebase. A LIVR schema is a plain data structure: you can keep it in a JSON file, a database row or a CMS, build it in a form builder, or receive it from another service. The validator never executes it, so a schema from an untrusted source cannot run code.

<div class="home-columns">
<div>
<p class="home-file">signup.json</p>

```json
{
  "email": ["required", "email", "to_lc"],
  "password": ["required", { "min_length": 8 }],
  "plan": { "one_of": ["free", "pro"] },
  "referrer": { "nested_object": {
    "code": { "like": "^[A-Z0-9]{6}$" }
  }}
}
```

</div>
<div>
<p class="home-file">server.js</p>

```js
import LIVR from 'livr';

// From a file, a database or an API: it is just data
const rules = await db.getValidationRules('signup');
const validator = new LIVR.Validator(rules);

const user = validator.validate(req.body);
if (!user) {
  res.status(422).json(validator.getErrors());
  // { email: 'WRONG_EMAIL', password: 'TOO_SHORT' }
}
```

</div>
</div>

The same JSON works in the browser, in Node.js, and in the Perl, PHP, Python, Go, Java, Ruby, Erlang and other [implementations](https://livr-spec.org/introduction/implementations.html). And because rules are data, a program can build them at runtime: per tenant, per form, per request. Creating a validator from them takes less than a microsecond, [see below](#rules-built-at-runtime).

<p class="home-more"><a href="/why/schemas-are-data">Why schemas as data →</a></p>

</div>

<div class="home-section">

<p class="home-pillar__eyebrow">Incredible performance</p>

## The fastest, also when rules are built at runtime {#rules-built-at-runtime}

Most validators are fast only when a schema is compiled once, at startup. When rules come from a database, differ per tenant or are put together in a form builder, every call needs a new validator, and validators that compile schemas into JavaScript code become 100–1000 times slower. LIVR builds a closure for every rule straight from the data, without generating code, and leads both benchmarks.

<BenchmarkHighlights />

<BenchmarkPair />

<p class="home-more"><a href="/why/performance">All results and how they were measured →</a></p>

</div>

<div class="home-section">

<p class="home-pillar__eyebrow">Type inference</p>

## Types straight from the schema

Add `as const` to a schema in your code, and `InferFromSchema` gives you the type of the validated data: required and optional fields, literal unions from `one_of`, nested objects and lists. There is no second definition to keep in sync and no code generator, and your own rules can declare their types too.

<div class="home-columns">
<div>
<p class="home-file">user.ts</p>

```ts
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const schema = {
  email: ['required', 'email'],
  role: { one_of: ['admin', 'user'] },
  address: { nested_object: {
    city: ['required', 'string'],
    zip: 'positive_integer',
  }},
  tags: { list_of: 'string' },
} as const;

type User = InferFromSchema<typeof schema>;

const validator = new LIVR.Validator<User>(schema);
const user = validator.validate(input); // User | false
```

</div>
<div>
<p class="home-file">the inferred type of User</p>

```ts
{
  email: string;
  role?: 'admin' | 'user';
  address?: {
    city: string;
    zip?: number;
  };
  tags?: string[];
}
```

</div>
</div>

<p class="home-more"><a href="/why/type-inference">How type inference works →</a> &nbsp;·&nbsp; <a href="https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAGQJIDUBKcBmUIjgcgBtgA3KfAbgChRJY4YBPMAUzgG84kA7TFqAGI4QAZQDGACxYgAhnAC+WYQWJkA9E1YBnSlSpq1cAIKJUGLZOlzgWuGEIzg3OABMZMGQDo4AAxm2xCG4tGB84QhYYWwAVZhZxKGAweCc+KCVcOGAYKkDg+AspWTgAXg4qODgrYEIALjgAbXwoFgBHAFdgFpd8ABoCasJ8AF1eirgcCPrOIJYAfQhMeqaZFxAnPoJ2rX4RhTHK1ZcWrS1p8cruFhCWFwWAIwArFjEYc8qPuDFsxmXmts63U2+BCiW4AHMRgdPnAAF5Jer4SBabKkeZOGAscG7aGVeTQ-HjDzgs4ccI2GALJYEUFOSH7KiKfxfIIhaj6QwACQgJH4cAAqjt0jAIHAdmwYFIsrx+N0GHEqJo2IK+WUeGkhLhxEUZAAeJWLMWWWQAPnZeRCcBIMmIbhF6TKVwA7qZ0J4UDbgHboLqVVATQAKQpWACU1At8G2qqtnu9UE81tt7hYAc4g0RMm43AAAiwAB4ycARTyBECbSYsDNrDb9YmkpqPHTDBRhvTATBwANRqAh8qVbueI4nLQAfhLPwocAMYpgYPBcAAPnB2twXCxME5boyqoQdn2WcEIMXCBBwQHE173NBPNiYABRKA4KBaAMh1vyKhAA">Try it in the TypeScript Playground ↗︎</a></p>

</div>

<div class="home-section">

<p class="home-pillar__eyebrow">Zero dependencies</p>

## Nothing to install but LIVR

`livr` has no runtime dependencies, so a compromised or abandoned package somewhere in the tree cannot reach your validation. It works in Node.js, browsers, workers and edge runtimes without polyfills.

<div class="stat-tiles">
  <div class="stat-tile">
    <div class="stat-tile__value">0</div>
    <div class="stat-tile__label">runtime dependencies</div>
  </div>
  <div class="stat-tile">
    <div class="stat-tile__value">~2 KB</div>
    <div class="stat-tile__label">validator core, min+gzip</div>
  </div>
  <div class="stat-tile">
    <div class="stat-tile__value">~5 KB</div>
    <div class="stat-tile__label">with all 35 built-in rules, min+gzip. Import only the rules you use to make it smaller</div>
  </div>
</div>

<p class="home-more"><a href="/why/zero-dependencies">Why zero dependencies →</a></p>

</div>

<div class="home-section">

<p class="home-pillar__eyebrow">Proven</p>

## Maintained for 13 years, backed by a specification

The library has been maintained since 2013 and its version 2 API has been stable since 2016. It implements the [LIVR specification](https://livr-spec.org), which comes with a shared test suite of JSON files. When an edge case is found in any of the implementations, in any language, it becomes a test case, and every implementation is checked against it. This library passes the whole suite.

<p class="home-more"><a href="/why/proven">How the specification keeps implementations honest →</a></p>

</div>

<div class="home-section">

## Everything else you expect

- **Error codes shaped like your data**: `{ address: { zip: 'NOT_POSITIVE_INTEGER' } }`, easy to translate and to map to form fields.
- **Validation and transformation in one pass**: `trim`, `to_lc`, `default` and type coercion of form strings like `'42'` to `42`.
- **Your own vocabulary**: combine rules into aliases such as `adult_age` with their own error codes, or write a rule in a few lines. [Custom rules](/guide/custom-rules)
- **Strict by default**: fields without rules are removed from the output, and the input is never changed.
- **Sync and async**: `import LIVR from 'livr/async'` for rules that query a database or an API.

</div>

<div class="home-section">

## Quick start

```bash
npm install livr
```

```ts
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const schema = {
  name: ['required', 'string'],
  email: ['required', 'email'],
  age: 'positive_integer',
  password: ['required', { min_length: 8 }],
  password2: { equal_to_field: 'password' },
} as const;

type User = InferFromSchema<typeof schema>;

const validator = new LIVR.Validator<User>(schema);
const user = validator.validate(input); // User, or false with validator.getErrors()
```

<RulesCard wide />

<p class="home-more"><a href="/guide/getting-started">Read the guide →</a> &nbsp;·&nbsp; <a href="https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAGQJIDUBKcBmUIjgcgBtgA3KfAbgChRJY4YBPMAUzgG84kA7TFqAGI4QAZQDGACxYgAhnAC+WYQWJkA9E1YBnSlSpq1cAIKJUGLZOlzgWuGEIzg3OABMZMGQDo4AAxm2xCG4tGB84QhYYWwAVZhZxKGAweCc+KCVcOGAYKkDg+AspWTgAXg4qODgrYEIALjgAbXwoFgBHAFdgFpd8ABoCasJ8AF1eirgcCPrOIJYAfQhMeqaZFxAnPoJ2rX4RhTHK1ZcWrS1p8cruFhCWFwWAIwArFjEYc8qPuDFsxmXmts63U2+BCiW4AHMRgdPnAAF5Jer4SBabKkeZOGAscG7aGVeTQ-HjDzgs4ccI2GALJYEUFOSH7KiKfxfIIhaj6QwACQgJH4cAAqjt0jAIHAdmwYFIsrx+N0GHEqJo2IK+WUeGkhLhxEUZAAeJWLMWWWQAPnZeRCcBIMmIbhF6TKVwA7qZ0J4UDbgHboLqVVATQAKQpWACU1At8G2qqtnu9UE81tt7hYAc4g0RMm43AAAiwAB4ycARTyBECbSYsDNrDb9YmkpqPHTDBRhvTATBwANRqAh8qVbueI4nLQAfhLPwocAMYpgYPBcAAPnB2twXCxME5boyqoQdn2WcEIMXCBBwQHE173NBPNiYABRKA4KBaAMh1vyKhAA">Try type inference in the TypeScript Playground ↗︎</a></p>

</div>
