// t/tests-types/strict-off/app.ts
// Strict mode turned off explicitly (`strictRules: false`): the same as without the option, rules
// without a type give `unknown` and schemas need no rule names as literal types. Verified via
// `npx tsc --noEmit -p t/tests-types/strict-off`. The option is global: a program of its own

import LIVR from 'livr';
import LIVRAsync from 'livr/async';
import type { InferFromSchema, LIVRSchema, LIVRRuleDefinition } from 'livr/types';
import type { As } from 'livr/types/inference';
import type { Expect, Equal } from '../utils';

declare module 'livr/types/inference' {
  interface TypeOptions {
    strictRules: false;
  }

  interface RuleTypes {
    typed_rule: As<string>;
  }
}

// Rules and aliases without a type are registered and used
LIVR.Validator.registerDefaultRules({ untyped_rule: () => () => undefined });
LIVR.Validator.registerAliasedDefaultRule({ name: 'untyped_alias', rules: ['required', 'string'] });
LIVRAsync.AsyncValidator.registerDefaultRules({ untyped_async_rule: () => async () => undefined });

const schema = {
  a: 'untyped_rule',
  b: ['required', 'untyped_alias'],
  c: { untyped_rule: 'x' },
  d: ['typed_rule', 'strng'], // a misspelled rule is not an error
  e: { nested_object: { f: ['required', 'untyped_rule'] } },
} as const;

const validator = new LIVR.Validator<InferFromSchema<typeof schema>>(schema);
validator.registerRules({ local_rule: () => () => undefined });
validator.registerAliasedRule({ name: 'local_alias', rules: { nested_object: { g: 'required' } } });
new LIVRAsync.AsyncValidator(schema);

// Schemas without literal rule names: without `as const`, typed as strings, built at runtime
const wide = { name: ['required', 'string'], email: 'email' };
const rules: string[] = ['required', 'email'];
const annotated: LIVRSchema = { a: 'untyped_rule' };
const fieldRules: LIVRRuleDefinition = ['untyped_rule', { max_length: 3 }];
new LIVR.Validator(wide);
new LIVR.Validator({ email: rules, other: fieldRules });
new LIVR.Validator(annotated);
new LIVR.Validator(JSON.parse('{}'));

// Rules without a type give unknown, like without the option
type _types = [
  Expect<
    Equal<
      InferFromSchema<typeof schema>,
      { a?: unknown; b: unknown; c?: unknown; d?: unknown; e?: { f: unknown } }
    >
  >,
];
