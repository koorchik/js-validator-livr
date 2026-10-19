---
layout: home
title: LIVR for JavaScript and TypeScript
titleTemplate: false

hero:
  name: LIVR
  text: Validation rules that are just data
  tagline: The fastest JavaScript validator in the benchmarks. Zero dependencies. TypeScript types inferred from the schema. Built on a cross-language specification and maintained since 2013.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Why LIVR
      link: /why/schemas-are-data
    - theme: alt
      text: GitHub
      link: https://github.com/koorchik/js-validator-livr

features:
  - icon: 📄
    title: Rules are just data
    details: A schema is a plain JSON structure, not code. Store it in a database, send it over the wire, share it with services in other languages, and load it safely even from untrusted sources.
    link: /why/schemas-are-data
    linkText: Why data beats code
  - icon: ⚡
    title: Incredible performance
    details: The fastest in the benchmarks against Valibot, Zod, fastest-validator, Ajv and Joi, both with a validator created once and with one created per call. Without code generation.
    link: /why/performance
    linkText: See the benchmarks
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

The same JSON works in the browser, in Node.js, and in the Perl, PHP, Python, Go, Java, Ruby, Erlang and other [implementations](https://livr-spec.org/introduction/implementations.html).

<p class="home-more"><a href="/why/schemas-are-data">Why schemas as data →</a></p>

</div>

<div class="home-section">

<p class="home-pillar__eyebrow">Incredible performance</p>

## The fastest, without generating code

fastest-validator and Ajv compile schemas into JavaScript code for speed, and that makes untrusted schemas dangerous. LIVR builds a closure for every rule once, and still leads both benchmarks: with a validator created once and reused, and with a validator created for every call, as with schemas loaded at runtime.

<BenchmarkHighlights />

<BenchmarkChart mode="static" />

<p class="home-more"><a href="/why/performance">Both benchmarks and how they were measured →</a></p>

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

- **TypeScript inference**: `InferFromSchema<typeof schema>` gives you the type of the validated data, with no second definition to keep in sync. [TypeScript guide](/typescript)
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

<p class="home-more"><a href="/guide/getting-started">Read the guide →</a> &nbsp;·&nbsp; <a href="https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAGQJIDUBKcBmUIjgcgBtgA3KfAbgChRJY4YBPMAUzgG84kA7TFqAGI4QAZQDGACxYgAhnAC+WYQWJkA9E1YBnSlSpq1cAIKJUGLZOlzgWuGEIzg3OABMZMGQDo4AAxm2xCG4tGB84QhYYWwAVZhZxKGAweCc+KCVcOGAYKkDg+AspWTgAXg4qODgrYEIALjgAbXwoFgBHAFdgFpd8ABoCasJ8AF1eirgZAHMWeqaWjq6WHv78SC1s0hYAfScYFmnyUfGcCPrOIO2ITFn8GRcQJz6Cdq1+EYUxyruXFq0tM-GlW4LBCSy2EAARgArFhiGAAyqIuBibKMG7zTrdJ74EKJbiTEafJFwABeSXqqwg6xgmx23D2Bz6gI+43kY0U-mRQRC1H0hgAEhASPw4ABVV7pGAQOCvNgwKRZXj8boMOJUTRscUiso8NJCXDiIoyAA8GquMsssgAfLy8iE4CQZMQ3FL0mVgQB3UzoTwoJ3AF3QY1aqBWgAUhSsAEpqHb4C9tQ7-YGoJ5Hc73Cww5xBhSZNxuAABFgADxk4AinkCICeUxmBAALAAmJ4neu3e6PBQxvTATBwMMJqBR8qVIeeNsUOAGAh3B7cfBwAA+zwli5X7W4LhYmCcSyoihYhFeo65wQglcIEEmYfTAfc0E80xgAFEoDgoFow1Ge-IqEA">Try type inference in the TypeScript Playground ↗</a></p>

</div>
