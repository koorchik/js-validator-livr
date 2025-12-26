## CHANGELOG

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
