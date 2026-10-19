# Getting started

## Installation

```bash
npm install livr
```

`livr` has no dependencies and ships its source as it is, with TypeScript declarations included.

### Browser

LIVR works in browsers through any bundler (Vite, esbuild, Rollup, webpack). Without a build step, load it from an ESM CDN:

```html
<script type="module">
  import LIVR from 'https://esm.sh/livr';

  const validator = new LIVR.Validator({ name: 'required' });
</script>
```

## First validator

```js
import LIVR from 'livr';

const validator = new LIVR.Validator({
  name: 'required',
  email: ['required', 'email'],
  age: 'positive_integer',
  password: ['required', { min_length: 8 }],
  password2: { equal_to_field: 'password' },
});

const validData = validator.validate(userData);

if (validData) {
  // Validated and cleaned data: fields without rules are removed
  saveUser(validData);
} else {
  console.log(validator.getErrors());
  // { email: 'WRONG_EMAIL', password: 'TOO_SHORT' }
}
```

A schema maps field names to rules. A field can have one rule (`'required'`), a list of rules (`['required', 'email']`), and a rule can take arguments (`{ min_length: 8 }`). The schema is plain data, so it can just as well come from a JSON file or a database.

Rule names work in both `snake_case` and `camelCase`: `one_of` and `oneOf`, `min_length` and `minLength` are the same rule. The [LIVR specification](https://livr-spec.org) uses `snake_case`, so schemas written that way also work in the other implementations.

`validate()` returns the validated data, or `false` if the data is invalid. `getErrors()` then returns error codes shaped like the input. Empty values (`undefined`, `null` and `''`) pass every rule except `required`, so optional fields need no special handling.

## With TypeScript

Add `as const` to the schema and get the type of the validated data from it:

```ts
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const userSchema = {
  name: ['required', 'string'],
  email: ['required', 'email'],
  age: 'positive_integer',
  role: { one_of: ['admin', 'user'] },
} as const;

type User = InferFromSchema<typeof userSchema>;
// { name: string; email: string; age?: number; role?: 'admin' | 'user' }

const validator = new LIVR.Validator<User>(userSchema);
const validData = validator.validate(input);

if (validData) {
  console.log(validData.age); // number | undefined
}
```

Nested objects, lists, unions and types of your own rules are covered in the [TypeScript guide](/typescript).

## Next steps

- [Usage](/guide/usage): modifiers, async validation, auto-trim and smaller bundles
- [Custom rules](/guide/custom-rules): aliases and rules of your own
- [Built-in rules](/rules): every rule with a link to its specification
- [Playground](https://livr-spec.org/playground.html): try schemas in the browser
