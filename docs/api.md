# API

`Validator` (from `livr`) and `AsyncValidator` (from `livr/async`) have the same API, except that the async `validate()` returns a promise and there is no async `getErrors()`.

## Static methods

### `new LIVR.Validator(schema, options?)`

Creates a validator.

```js
const validator = new LIVR.Validator(schema, { autoTrim: true });
```

| Option     | Default | Description                              |
| ---------- | ------- | ---------------------------------------- |
| `autoTrim` | `false` | Trim all string values before validation |

### `Validator.defaultAutoTrim(boolean)`

Turns auto-trim on or off for all validators created afterwards.

```js
LIVR.Validator.defaultAutoTrim(true);
```

### `Validator.registerDefaultRules(rules)`

Registers rules for all validators.

```js
LIVR.Validator.registerDefaultRules({
  my_rule(arg) {
    return value => {
      /* ... */
    };
  },
});
```

### `Validator.registerAliasedDefaultRule(alias)`

Registers a rule alias for all validators.

```js
LIVR.Validator.registerAliasedDefaultRule({
  name: 'adult_age',
  rules: ['positive_integer', { min_number: 18 }],
  error: 'MUST_BE_ADULT', // optional
});
```

### `Validator.getDefaultRules()`

Returns a new object with all default rules: the built-in rules of the validator class and the rules registered with `registerDefaultRules()` and `registerAliasedDefaultRule()`.

## Instance methods

### `validator.validate(data)`

Validates the data against the schema.

Sync validator:

```js
const result = validator.validate(data);
if (result) {
  // result contains the validated data
} else {
  const errors = validator.getErrors();
}
```

Async validator:

```js
try {
  const result = await validator.validate(data);
} catch (errors) {
  // the errors object
}
```

### `validator.getErrors()`

Returns the errors of the last validation (sync validator only).

```js
{
  email: 'WRONG_EMAIL',
  password: 'TOO_SHORT',
  address: { zip: 'NOT_POSITIVE_INTEGER' },
}
```

### `validator.prepare()`

Compiles the rules. `validate()` calls it on the first validation; call it yourself to warm up.

```js
const validator = new LIVR.Validator(schema).prepare();
```

### `validator.getFieldRule(fieldName)`

Returns all rules of a schema field as one rule function `(value, allValues, outputArr) => errorCode`, prepared once. It runs the rules like `validate()` does for that field: in order, each rule gets the output of the previous one. On success it returns `undefined`. Like any rule, it pushes the output value to `outputArr` only when the rules change the value, so a missing value stays missing. With `AsyncValidator` it returns a promise only when some rule returns a promise. With `autoTrim` the value is trimmed before the rules run; `allValues` are passed to the rules as given.

Use it in custom meta rules that validate many values with the same rules: it skips the result and errors objects that `validate()` builds for every call. Built-in `list_of` and `or` work this way.

```js
function list_of_tags(itemRules, ruleBuilders) {
  const validateItem = new LIVR.Validator({ item: itemRules })
    .registerRules(ruleBuilders)
    .getFieldRule('item');

  return (values, params, outputArr) => {
    if (!Array.isArray(values)) return 'FORMAT_ERROR';

    const output = [];
    for (const value of values) {
      const itemOutput = [];
      const errorCode = validateItem(value, params, itemOutput);
      if (errorCode) return errorCode;

      // The value as is, unless the rules changed it
      output.push(itemOutput.length ? itemOutput[0] : value);
    }

    outputArr.push(output);
  };
}
```

### `validator.registerRules(rules)`

Registers rules for this validator only.

```js
validator.registerRules({
  custom_rule() {
    return value => {
      /* ... */
    };
  },
});
```

### `validator.registerAliasedRule(alias)`

Registers a rule alias for this validator only.

```js
validator.registerAliasedRule({
  name: 'strong_password',
  rules: { min_length: 8 },
  error: 'WEAK_PASSWORD',
});
```

### `validator.getRules()`

Returns all rules registered for this validator.

## Exports

| Import                                     | What                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `import LIVR from 'livr'`                  | `{ Validator, rules, util }` with all built-in rules registered        |
| `import LIVR from 'livr/async'`            | `{ AsyncValidator, rules, util }` with the async meta rules            |
| `import Validator from 'livr/lib/Validator'` | the bare validator, no rules registered, for [smaller bundles](/guide/usage#smaller-bundles) |
| `import type { ... } from 'livr/types'`    | `InferFromSchema` and the other [types](/typescript#available-type-exports) |
