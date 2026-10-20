# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LIVR (Language Independent Validation Rules) is a JavaScript validator implementing the LIVR specification. It provides declarative, language-independent validation rules for data validation.

## Commands

```bash
# Run all tests (runtime tests with coverage + TypeScript type checks). Needs Node.js 22.8+
npm test

# Run runtime tests only (node:test, no dependencies)
node --test "t/tests-sync/*.js" "t/tests-async/*.js"

# Run a specific test file, or tests matching a name
node --test t/tests-sync/01-test_suite.js
node --test --test-name-pattern="variable_object" t/tests-async/01-test_suite.js

# Type checks only (TypeScript definitions and type inference): the tests in t/tests-types,
# then the programs in t/tests-types/packages, t/tests-types/strict and t/tests-types/types-only
npm run test:types
```

There is no build step: the package ships `lib/` as it is, browsers use it through a bundler or an ESM CDN.

## Architecture

### Core Classes (lib/)

- **BaseValidator.js** - Abstract base class containing shared validation logic: rule parsing, validator building, auto-trim functionality, and static methods for registering default rules. Built-in rules are stored per validator family (`Validator`, `AsyncValidator`; the entry points register them with `_registerBuiltInRules()`), so both entry points can be loaded in one process. Rules registered through `registerDefaultRules()` / `registerAliasedDefaultRule()` are shared by both families and take precedence over built-in rules. Registries have no prototype, and rule lookup checks own properties only
- **Validator.js** - Synchronous validator extending BaseValidator. Returns `false` on validation failure, validated data on success. `getFieldRule(fieldName)` returns all rules of a field as one rule function; `list_of`, `or` and aliases use it instead of `validate()`
- **AsyncValidator.js** - Asynchronous validator extending BaseValidator. Validates fields in parallel but processes rules sequentially per field. Rules run synchronously (rule #0 of all fields, then #1...) until one returns a promise, only then the field is awaited. Its `getFieldRule()` returns the error code, or a promise only when a rule returns one. Rejects with errors on failure
- **LIVR.js** - Main entry point for sync validator; registers all default rules and exports `{ Validator, rules, util }`
- **async.js** (root) - Entry point for async validator with async-specific meta rules

### Rule Structure (lib/rules/)

Rules are organized by category:
- `common/` - required, not_empty, not_empty_list, any_object
- `string/` - eq, one_of, min_length, max_length, length_equal, length_between, like, string
- `numeric/` - integer, positive_integer, decimal, positive_decimal, min_number, max_number, number_between
- `special/` - email, url, equal_to_field, iso_date
- `modifiers/` - trim, to_lc, to_uc, default, remove, leave_only
- `meta/` - nested_object, variable_object, list_of, list_of_objects, list_of_different_objects, or
- `meta-async/` - Async versions of meta rules for AsyncValidator

Every rule file is self-contained: it may use the generic helpers of `lib/util.js` and public validator methods (`validate()`, `getErrors()`, `getFieldRule()`...), but no private methods (`_name`) and no shared rule-specific modules. Repeat code between rules (for example, sync and async versions of a meta rule) instead of extracting it into a separate file.

### Rule Builder Pattern

Each rule is a factory function that receives rule arguments and returns a validator function:
```javascript
function ruleName(arg1, arg2, ruleBuilders) {
  return (value, allValues, outputArr) => {
    // Return error code string on failure, undefined on success
    // Push to outputArr to modify the output value
  };
}
```

### Test Structure (t/)

- Tests use the built-in Node.js test runner (`node:test`) and `node:assert/strict`, no test dependencies. Coverage comes from `--experimental-test-coverage` with global thresholds in the `test` script
- `t/tests-sync/` - Sync validator tests
- `t/tests-async/` - Async validator tests
- `t/test_suite/` - JSON-based test cases (positive, negative, aliases_positive, aliases_negative)
  - Each test case is a directory containing `rules.json`, `input.json`, and `output.json` (positive) or `errors.json` (negative)
  - Alias tests also include `aliases.json`
- `t/tests-types/` - Compile-time type inference tests (`tsc --noEmit`): every built-in rule, custom rules and aliases, the deprecated registries. Rule types are global, so each file uses rule names of its own
- `t/tests-types/packages/` - A separate program: an application with rule packages that add types to `livr/types/inference` (through `paths`), like installed ones. `livr-extra-rules.d.ts` is a copy of a published package with the deprecated registries
- `t/tests-types/strict/` - A separate program with strict mode on (`strictRules: true` in `TypeOptions`, global like rule types): schemas with misspelled rules at every place, `@ts-expect-error` for the validator API
- `t/tests-types/types-only/` - A separate program that imports only `livr/types/inference`, like a rule package: the built-in rule types must load with it

### TypeScript Types (types/)

- `types/index.d.ts` - Main type declarations for Validator class and exports
- `types/inference.d.ts` - Type inference engine for `InferFromSchema<T>` functionality. It has no rule-specific code
- Each rule in `lib/rules/` has a `.d.ts` file next to it with the whole type of the rule, meta rules included. `types/inference.d.ts` loads them with `/// <reference path>`. It adds the type to `BuiltInRuleTypes` (snake_case name only, camelCase is automatic): `As<T>` for rules that check or convert to `T`, a plain type for rules that make a new value, an interface extending `RuleType` (reading `this['args']` and `this['input']`) for the rest, with `present: true` when the field is always present
- Users and rule packages add types to `RuleTypes`, which overrides `BuiltInRuleTypes`, like registered rules override built-in ones. The deprecated `RuleTypeRegistry` and `ParameterizedRuleRegistry` are still read, before the built-in types
- Members of the field state (`NextState`) are computed only when they are read, and presence is a flag of a rule type (`present`), never read from `output`: a conditional type on the output of a rule computes nested objects with their parent, and TypeScript stops at a few levels of nesting (`t/tests-types/05-deep-schemas.ts`)
- Strict mode checks schemas by assignability to `LIVRSchema` (`StrictSchema`), not by the inference engine, which reads any schema (`AnySchema`). Meta rules set `params` (the types of their arguments), so nested rules are checked. TypeScript compares types to about 100 levels and every union on the way costs a level: strict mode checks 16 levels of `nested_object`, avoid new unions in `StrictSchema`. A rule object must not match a string or an array: they have methods named like rules (`trim`, `sort`), hence `length?: never`
- `skipLibCheck` is off, so the declaration files are type-checked too. They must work with TypeScript 5.0+ (`npm test` uses TypeScript 7; 5.4-5.9 check generic constraints differently, test with them too)

### Utilities (lib/util.js)

Helper functions: `isPrimitiveValue`, `looksLikeNumber`, `isObject`, `isEmptyObject`, `escapeRegExp`, `isNoValue`, `isThenable`, `getFieldValue`, `camelize`. Exported as `LIVR.util`, so additions become public API

## Key Patterns

- Rule names support both underscore (`min_length`) and camelCase (`minLength`) - automatic camelization on registration
- Validators are reusable - construct once, validate many inputs
- `prepare()` compiles rules on first validation or can be called manually for warmup
- Empty values (`undefined`, `null`, `''`) skip validation unless using `required` rule
- Sync validator returns `false` on failure; async validator throws/rejects with errors object
- Use `import LIVR from 'livr'` for sync, `import LIVR from 'livr/async'` for async

## Documentation Site

`docs/` is the source of [js.livr-spec.org](https://js.livr-spec.org), a VitePress site with its own `docs/package.json`, so the library keeps TypeScript as its only dev dependency. `.github/workflows/docs.yml` builds it and deploys it to GitHub Pages on pushes to master and weekly.

```bash
cd docs && npm ci
npm run dev     # local server
npm run build   # also fails on dead links

# Benchmark charts from a local validators-benchmarks checkout instead of GitHub
BENCHMARK_RESULTS=../../livr-benchmark/results npm run dev
```

- The README is short: pitch, install, quick start, rules table. Guides, API, TypeScript and design go to the site
- `docs/DESIGN.md` and `docs/TYPESCRIPT.md` keep their names (old links) and are mapped to `/why/design-decisions` and `/typescript` by `rewrites` in `docs/.vitepress/config.mts`. Anchors are GitHub-style, so links work on GitHub and on the site
- The site leads with four pillars: rules are just data, performance (also for rules built at runtime, the benchmark with a validator created per call), type inference, zero dependencies, plus trust (since 2013, the spec and its shared test suite). Pages in `docs/why/` explain them
- Benchmark charts and numbers are not stored here: `docs/scripts/fetch-benchmark.mjs` downloads `results/latest*.{json,svg}` of validators-benchmarks into `docs/public/benchmark/` (gitignored) before every build
- The home page example is validated at build time by `lib/` (`docs/.vitepress/data/hero.data.ts`), so its output is always real
- The site uses JavaScript yellow (`--js-yellow` in `custom.css`), so it is not confused with the blue livr-spec.org. Light-theme links use dark amber for contrast
- The rules reference lives on livr-spec.org and is linked everywhere: the "All rules" nav button, `RulesCard` at the top of the sidebar and on the home, getting started and rules pages, and a hero button

## Code Style

Prettier config is in `.prettierrc.json`: 2 spaces, single quotes, 100 columns, ES5 trailing commas, no parentheses around a single arrow function parameter. `t/test_suite` is a copy of the LIVR spec test suite and is not formatted.
