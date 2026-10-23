## CHANGELOG

Unreleased
-   The npm package contains only `lib`, `async.js`, `async.d.ts`, `types`, the guides, the API and the TypeScript guide (`docs/`), README, LICENSE and CHANGELOG (98 files instead of 341): tests, editor and CI configs are no longer published
-   Code examples in README and docs use 2-space indentation, like the code
-   Docs: new documentation site [js.livr-spec.org](https://js.livr-spec.org), built from `docs/` and deployed to GitHub Pages. The README is short now, with links to the site
-   Docs: `docs/DESIGN.md` starts with the decisions behind the main benefits (schemas as data, no code generation, performance, zero dependencies, the specification). Sizes are re-measured: about 2 KB min+gzip for the core and 5 KB with all rules (the README said < 1 KB and ~3 KB). The code-injection example shows the actual result, and the list of implementations matches livr-spec.org
-   Types: rule types are in `RuleTypes` (your rules, aliases and rule packages) and `BuiltInRuleTypes` (built-in rules), declared with `As<T>`, `Present<T>`, `AliasType<typeof rules>` or an interface that extends `RuleType`, reads the rule arguments and the type of earlier rules, and sets `present: true` for a rule that makes the field present. Every rule has its whole type in the `.d.ts` file next to it, meta rules included: `types/inference.d.ts` has no list of built-in rules anymore. camelCase names are typed automatically. A type in `RuleTypes` replaces the type of a built-in rule, like `registerDefaultRules()` and `registerAliasedDefaultRule()` replace the rule. For meta rules, `InferRuleType<Rules, Input>` gets the type of a value before the rules, and `MakesPresent<Rules, Input>` is `true` when the rules make the field present. See the [TypeScript guide](https://js.livr-spec.org/typescript#custom-rules-type-inference)
-   Types: `RuleTypeDef`, `RuleTypeRegistry`, `ParameterizedRuleDef`, `ParameterizedRuleRegistry`, `TemplateOutputRegistry`, `SimpleRule`, `RequiredRule`, `ParameterizedRule` and `DefaultRule` are deprecated. They still work, and come before the built-in rule types: livr-extra-rules 1.6.1 is typed as before. `RuleTypeRegistry` does not list the built-in rules anymore, `RuleTypeRegistry['email']` is `BuiltInRuleTypes['email']` now. The [migration guide](https://js.livr-spec.org/typescript#migrating-from-ruletypedef) maps every old declaration to the new one
-   Types of the built-in rules follow the runtime more closely, so some fields get more precise types:
    -   `required` keeps the type of earlier rules: `['string', 'required']` was `unknown`, now it is `string`. The same for `RequiredRule` of older packages
    -   Rules that check or convert a value keep a more precise type of earlier rules: `[{ one_of: ['a', 'b'] }, { max_length: 1 }]` was `string`, now it is `'a' | 'b'`. The same for `string`, `like`, the length, numeric and special rules, `not_empty` and `any_object`. `not_empty` and `equal_to_field` keep the type, so `['integer', 'not_empty']` is a `number`
    -   `to_lc` and `to_uc` change the case of literal types: `[{ one_of: ['A', 'B'] }, 'to_lc']` is `'a' | 'b'`
    -   `not_empty_list` makes the field required, as a missing list is an error, and keeps the list type of earlier rules
    -   `one_of` and `list_of` with the values or rules in an array, as the specification writes them: `{ one_of: [['a', 'b']] }` was the array type, now it is `'a' | 'b'`. `{ list_of: [['required', 'integer']] }` was `unknown[]`, now it is `number[]`
    -   `default` after other rules keeps their type: `[{ one_of: ['a', 'b'] }, { default: 'a' }]` was `string`, now it is `'a' | 'b'`. An array default (`{ default: [[1, 2]] }`) has the type of the array, the value the rule gets
    -   `or` makes the field required when every set of rules does (`{ or: [['required', 'string'], ['required', 'integer']] }`), and its sets of rules get the type of earlier rules
    -   `variable_object` and `list_of_different_objects`: the selector field is in the type only when the schema of the selector value has it, as the output has only the fields of that schema
-   Types: `registerAliasedRule()` and `registerAliasedDefaultRule()` accept a rule name as `rules` (`rules: 'required'`), like at runtime
-   Types of `livr/async`: `AsyncValidator` with the same schemas and type inference as `Validator`, `validate()` returns a promise of the type, rules may return promises. `livr/async` had no types before, `import LIVR from 'livr/async'` failed to compile with `strict`
-   Types: the `options` argument of the constructor (`{ autoTrim: true }` or a boolean), `validator.getRules()` and `LIVR.util` were missing. `validator.getAliasedRule()` and `LIVR.ValidatorError` are deprecated: they do not exist at runtime
-   Types: strict mode, `strictRules: true` in `TypeOptions` of `livr/types/inference`: a rule without a type is a compile error, instead of the `unknown` type. It catches misspelled rules and forgotten types of custom rules and aliases, in schemas of validators (also inside meta rules), with `satisfies LIVRSchema`, in aliases and in the names of registered rules. Meta rules declare their arguments with `params`, custom meta rules can too. Off by default, so existing projects keep compiling, and recommended for new projects: README, the guides, `llms.txt` and `context7.json` say so. `strictRules: false` turns it off explicitly. See the [TypeScript guide](https://js.livr-spec.org/typescript#strict-mode). `RuleName` is the union of the names of the rules with a type
-   Type checks of the package check its declaration files too (`skipLibCheck` is off), and cover every built-in rule, custom rules, aliases, the deprecated registries, an application with several rule packages, strict mode on and turned off with `strictRules: false`, and a program with only `livr/types/inference` (`npm run test:types`)
-   Docs: the TypeScript guide covers types of rules with arguments, meta rules, aliases, replaced built-in rules, rule packages, strict mode, the migration from `RuleTypeDef` and the limitations. A TypeScript example on the design decisions page used `'boolean'`, a rule of livr-extra-rules, as a built-in rule
-   Docs for AI assistants: the site publishes [llms.txt](https://js.livr-spec.org/llms.txt), [llms-full.txt](https://js.livr-spec.org/llms-full.txt) and a Markdown copy of every page, and `context7.json` sets up [Context7](https://context7.com). The guides, the API and the TypeScript guide are in the package (`node_modules/livr/docs`), and pages link each other with relative links, which work there and on GitHub. The README shows custom rules with their types, and the declarations of `registerRules()`, `registerAliasedRule()` and `RuleTypes` say how to declare the type of a custom rule, with links to the guide

v2.11.0
-   Fix: `livr/async`, `livr/lib/*` (tree-shaking) and `livr/types` were not importable since 2.9.2 (`ERR_PACKAGE_PATH_NOT_EXPORTED`), as the `exports` field listed only `.` and `./types/inference`
-   Fix: `validate()` threw a `TypeError` when the input had its own `hasOwnProperty` key
-   Fix: when both `livr` and `livr/async` were loaded, the one loaded last replaced meta rules (`nested_object`, `list_of`, etc.) of the other. Built-in rules are now stored per validator family. Rules registered through `registerDefaultRules()` and `registerAliasedDefaultRule()` are still shared by both classes, so custom rules and overrides of built-in rules work in both (async rules only in `AsyncValidator`, as before). `getDefaultRules()` returns a new object with the built-in and registered rules
-   Fix: `list_of_different_objects` passed a list when all its invalid items were not objects or had a missing or unknown selector value, and dropped such items from the output. A `null` item threw a `TypeError`
-   Fix: `variable_object` and `list_of_different_objects` threw a `TypeError` when the selector value was the name of an `Object.prototype` property (`"constructor"`, `"toString"`, `"__proto__"`, ...), and accepted arrays as selector values. Both return `FORMAT_ERROR` now
-   Fix: missing fields named like `Object.prototype` methods (`constructor`, `toString`, `hasOwnProperty`, ...) got the inherited method as a value: `required` passed and `default` was not applied
-   Fix: objects with own `constructor` key failed with `FORMAT_ERROR` (on any level) and were not auto trimmed
-   Fix: rule names like `toString` or `constructor` were found on `Object.prototype`: instead of `Rule [toString] not registered`, validation failed later with a `TypeError`
-   Fix: `registerAliasedDefaultRule()` did not register the camelCase name of an alias (`myAlias` for `my_alias`), and overriding a default rule did not update its camelCase name
-   Fix: `AsyncValidator`: an exception thrown by a rule inside `or` or an alias without its own error code was lost, and the value passed validation. Inside `list_of` the error of such item was `undefined`. The exception is the error now, as in `nested_object`
-   Objects without prototype (`Object.create(null)`, `querystring.parse()` output) are validated as objects, `util.isObject()` returns `true` for them
-   `util.isThenable()` and `util.getFieldValue()` (value of a data field; inherited methods like `constructor` are not taken as values)
-   `validator.getFieldRule(fieldName)` (sync and async): all rules of a schema field as one rule function, for custom meta rules that validate many values with the same rules. Like any rule, it pushes the output value only when the rules change it. Built-in `list_of`, `or` and aliases use it
-   Fix: an alias or `or` on a missing field added the field to the output with the value `undefined` (the key was there, unlike with other rules). A missing field stays missing now
-   Test suite: sync with the LIVR spec repository, which got cases for the fixes above
-   Performance (no API changes; compared with 2.10.2 on Node.js 26):
    -   Sync validator: 1.1-1.5x faster for flat and nested forms, `list_of` 2.1x, `or` and aliases 1.7x, `iso_date` 2.5x, `email` 2.4-3x, `one_of` with long lists up to 4.7x
    -   Validator construction (new validator per validation): 1.6x faster
    -   Async validator: 2.2-2.5x faster. Rules that return plain values no longer cost an `await`. With synchronous rules the key order of results and errors is the same as before; with rules returning promises (async meta rules, aliases, custom async rules) it may differ, as it depended on microtask timing
    -   Async `or`, `list_of` and aliases return their result without a promise while their rules are synchronous, so such fields need no `await` either
-   Benchmarks moved to the separate `validators-benchmarks` repository: `benchmarks/bench.js`, the `bench` script and the `benchmark` dev dependency are removed
-   Tests: migrated from AVA and nyc to the built-in `node:test` and `node:assert/strict` with built-in coverage, both dev dependencies are removed. Running the tests needs Node.js 22.8+
-   CI: GitHub Actions (Node.js 22, 24 and 26) instead of Travis CI
-   Removed the `dist/` browser bundles (last built for 2.7.1, so later releases shipped outdated code), the webpack build and the `livr/dist/*` export. Use a bundler or an ESM CDN (see README). Dev dependencies are down to TypeScript
-   Type checks of the package run with TypeScript 7 (the type declarations still work with TypeScript 5)
-   Docs: re-measure the comparison with Zod, Valibot, Joi, fastest-validator and Ajv in `docs/DESIGN.md` and README

v2.10.2
-   Security hardening: Skip `__proto__` key in `_autoTrim` and `prepare()` to prevent local prototype manipulation
-   This is a low-severity issue: it could only affect validation logic when `autoTrim: true` and attacker-controlled JSON input contains `__proto__` property. Global `Object.prototype` was never at risk.
-   Add security test suite for prototype pollution vectors

v2.9.4
-   Type inference: `default` rule now widens literal types to primitives (e.g., `{default: 10}` infers as `number` instead of `10`)
-   Use type assertions with unions to preserve specific types (e.g., `{default: 'ACTIVE' as 'ACTIVE' | 'PENDING'}`)
-   Add TypeScript type inference tests (`t/types-test.ts`)
-   Add `tsconfig.json` for type checking
-   `npm test` now includes TypeScript type checks

v2.9.3
-   Add support for custom templates for complex cases of type inference

v2.9

-   Add types inference engine

v2.8.1

-   Add basic types for typescript

v2.7.1

-   300-500% faster validator construction. Useful when you construct new Validator for each validation.
-   Remove "camelizeRules" option. Now it is always enabled but does not overried existing rules if there is a conflict.

v2.7

-   25% faster validation comparing to v2.5
-   Automatically camelize default rules (both names can be used in schemas)
-   Validator constructor now accepts "options" object. Required for future options extensability
