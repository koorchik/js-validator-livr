---
title: Zero dependencies
description: livr has no runtime dependencies. About 2 KB for the core and 5 KB with every built-in rule, min+gzip.
---

# Zero dependencies

`npm install livr` installs one package: `livr`. It has no runtime dependencies, so there is nothing to audit but LIVR itself, and nothing in a dependency tree that can break, be abandoned or be compromised.

> **Supply-chain safety and a small footprint** are the priority → **no runtime dependencies** → every rule is implemented in LIVR itself, not taken from a library

## Why it matters

**Supply-chain attacks go through dependencies.** Validation sits on the path of every request, so a compromised package there sees all your input. Popular packages have been hijacked before: [event-stream](https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident) got code that targeted a bitcoin wallet app, [ua-parser-js](https://github.com/faisalman/ua-parser-js/issues/536) got a cryptominer and a password stealer, and the author of [colors and faker](https://www.bleepingcomputer.com/news/security/dev-corrupts-npm-libs-colors-and-faker-breaking-thousands-of-apps/) broke them on purpose. A package without dependencies can only be attacked directly.

**Audits stay short.** Security reviews and compliance checks (SOC 2, ISO 27001, HIPAA) cover every package you ship. With LIVR, that is one package with readable, unminified source.

**Nothing changes under you.** No upstream breaking change, no version conflict with another library, no deprecation warning from a transitive package. The version 2 API has been stable since 2016.

## Dependencies of popular validators

| Validator | Version | Runtime dependencies |
| --- | --- | --- |
| **LIVR** | 2.11.0 | **0** |
| Zod | 4.6.7 | 0 |
| Valibot | 1.5.0 | 0 |
| fastest-validator | 1.19.1 | 0 |
| Ajv | 8.20.0 | 4: fast-deep-equal, fast-uri, json-schema-traverse, require-from-string |
| Joi | 18.3.0 | 7: six `@hapi/*` packages and `@standard-schema/spec` |

Zero dependencies alone is not unique. LIVR is the one that combines it with schemas as data and with the speed of the [benchmarks](/why/performance).

## Size

Measured with esbuild (`--bundle --minify`) and gzip, version 2.11.0:

| What you import | min+gzip |
| --- | --- |
| `livr/lib/Validator`, the core without rules | ~2 KB |
| `livr`, the core and all 35 built-in rules | ~5 KB |
| `livr/async`, the async validator and all rules | ~5.6 KB |

The package ships its source as it is, without a build step, so you can read in `node_modules` exactly the code you run. To ship only the rules you use, import them one by one, see [Smaller bundles](/guide/usage#smaller-bundles).

## Runs anywhere

LIVR uses no Node.js APIs and needs no polyfills: it runs in Node.js, Deno, Bun, browsers, web workers and edge runtimes such as Cloudflare Workers. In a browser, load it through any bundler or straight from an ESM CDN:

```html
<script type="module">
  import LIVR from 'https://esm.sh/livr';
</script>
```

## The trade-off

Every rule is written in LIVR, so there is no `validator.js` or `date-fns` behind `email` or `iso_date`. The built-in rules are the ones of the [specification](https://livr-spec.org/validation-rules.html), and more rules come from [livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules), which has no dependencies either, or from your own [custom rules](/guide/custom-rules).

## More

- [Design decision #4: Zero dependencies](/why/design-decisions#design-decision-4-zero-dependencies)
