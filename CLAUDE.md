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

# Type check only (verify TypeScript definitions and type inference)
npx tsc --noEmit
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
- `t/types-test.ts` - Compile-time type inference tests (verified via `tsc --noEmit`)

### TypeScript Types (types/)

- `types/index.d.ts` - Main type declarations for Validator class and exports
- `types/inference.d.ts` - Type inference engine for `InferFromSchema<T>` functionality
- Each rule in `lib/rules/` has a corresponding `.d.ts` file that registers its type in `RuleTypeRegistry`

### Utilities (lib/util.js)

Helper functions: `isPrimitiveValue`, `looksLikeNumber`, `isObject`, `isEmptyObject`, `escapeRegExp`, `isNoValue`, `isThenable`, `getFieldValue`, `camelize`. Exported as `LIVR.util`, so additions become public API

## Key Patterns

- Rule names support both underscore (`min_length`) and camelCase (`minLength`) - automatic camelization on registration
- Validators are reusable - construct once, validate many inputs
- `prepare()` compiles rules on first validation or can be called manually for warmup
- Empty values (`undefined`, `null`, `''`) skip validation unless using `required` rule
- Sync validator returns `false` on failure; async validator throws/rejects with errors object
- Use `import LIVR from 'livr'` for sync, `import LIVR from 'livr/async'` for async

## Code Style

Prettier config is in `.prettierrc.json`: 2 spaces, single quotes, 100 columns, ES5 trailing commas, no parentheses around a single arrow function parameter. `t/test_suite` is a copy of the LIVR spec test suite and is not formatted.
