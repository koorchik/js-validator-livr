# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LIVR (Language Independent Validation Rules) is a JavaScript validator implementing the LIVR specification. It provides declarative, language-independent validation rules for data validation.

## Commands

```bash
# Run all tests with coverage and size check
npm test

# Run tests only (using AVA test runner)
npx ava

# Run a specific test file
npx ava t/tests-sync/01-test_suite.js
npx ava t/tests-async/01-test_suite.js

# Type check (verify TypeScript definitions)
npx tsc --noEmit

# Build browser bundles (sync and async, dev and production)
npm run build

# Check bundle size limits
npm run size
```

## Architecture

### Core Classes (lib/)

- **BaseValidator.js** - Abstract base class containing shared validation logic: rule parsing, validator building, auto-trim functionality, and static methods for registering default rules
- **Validator.js** - Synchronous validator extending BaseValidator. Returns `false` on validation failure, validated data on success
- **AsyncValidator.js** - Asynchronous validator extending BaseValidator. Validates fields in parallel but processes rules sequentially per field. Rejects with errors on failure
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

- Tests use AVA framework
- `t/tests-sync/` - Sync validator tests
- `t/tests-async/` - Async validator tests
- `t/test_suite/` - JSON-based test cases (positive, negative, aliases_positive, aliases_negative)
  - Each test case is a directory containing `rules.json`, `input.json`, and `output.json` (positive) or `errors.json` (negative)
  - Alias tests also include `aliases.json`

### TypeScript Types (types/)

- `types/index.d.ts` - Main type declarations for Validator class and exports
- `types/inference.d.ts` - Type inference engine for `InferFromSchema<T>` functionality
- Each rule in `lib/rules/` has a corresponding `.d.ts` file that registers its type in `RuleTypeRegistry`

### Utilities (lib/util.js)

Helper functions: `isPrimitiveValue`, `looksLikeNumber`, `isObject`, `isEmptyObject`, `escapeRegExp`, `isNoValue`, `camelize`

## Key Patterns

- Rule names support both underscore (`min_length`) and camelCase (`minLength`) - automatic camelization on registration
- Validators are reusable - construct once, validate many inputs
- `prepare()` compiles rules on first validation or can be called manually for warmup
- Empty values (`undefined`, `null`, `''`) skip validation unless using `required` rule
- Sync validator returns `false` on failure; async validator throws/rejects with errors object
- Use `import LIVR from 'livr'` for sync, `import LIVR from 'livr/async'` for async
