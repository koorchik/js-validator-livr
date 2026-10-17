## CHANGELOG

Unreleased
-   Fix: `livr/async`, `livr/lib/*` (tree-shaking) and `livr/types` were not importable since 2.9.2 (`ERR_PACKAGE_PATH_NOT_EXPORTED`), as the `exports` field listed only `.` and `./types/inference`
-   Fix: `validate()` threw a `TypeError` when the input had its own `hasOwnProperty` key
-   Fix: when both `livr` and `livr/async` were loaded, the one loaded last replaced meta rules (`nested_object`, `list_of`, etc.) of the other. Default rules are now stored per validator family; custom rules registered through one class still work in the other
-   Fix: `list_of_different_objects` passed a list when all its invalid items were not objects or had a missing or unknown selector value, and dropped such items from the output. A `null` item threw a `TypeError`
-   Fix: `variable_object` and `list_of_different_objects` threw a `TypeError` when the selector value was the name of an `Object.prototype` property (`"constructor"`, `"toString"`, `"__proto__"`, ...), and accepted arrays as selector values. Both return `FORMAT_ERROR` now
-   Fix: missing fields named like `Object.prototype` methods (`constructor`, `toString`, `hasOwnProperty`, ...) got the inherited method as a value: `required` passed and `default` was not applied
-   Fix: objects with own `constructor` key failed with `FORMAT_ERROR` (on any level) and were not auto trimmed
-   Objects without prototype (`Object.create(null)`, `querystring.parse()` output) are validated as objects, `util.isObject()` returns `true` for them
-   `util.isThenable()` and `util.getFieldValue()` (value of a data field; inherited methods like `constructor` are not taken as values)
-   Test suite: sync with the LIVR spec repository, which got cases for the fixes above
-   Performance (no API changes):
    -   Sync validator: 1.1-1.4x faster for flat and nested forms, `list_of` 2.2x, `or` and aliases 1.6-1.7x, `iso_date` 2.4x, invalid emails 1.8x, `one_of` with long lists up to 4.7x
    -   Validator construction (new validator per validation): 1.2-1.3x faster
    -   Async validator: 1.7-2.9x faster. Rules that return plain values no longer cost an `await`. With synchronous rules the key order of results and errors is the same as before; with rules returning promises (async meta rules, aliases, custom async rules) it may differ, as it depended on microtask timing
-   Benchmarks moved to the separate `validators-benchmarks` repository: `benchmarks/bench.js`, the `bench` script and the `benchmark` dev dependency are removed
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
