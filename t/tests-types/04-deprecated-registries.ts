// t/tests-types/04-deprecated-registries.ts
// Rule types declared the old way (RuleTypeRegistry, ParameterizedRuleRegistry) still work
// Verified at compile time via `npx tsc --noEmit`

import type {
  As,
  InferFromSchema,
  RuleTypeDef,
  RuleTypeRegistry,
  ParameterizedRuleDef,
  SimpleRule,
  RequiredRule,
  DefaultRule,
  ParameterizedRule,
} from '../../types/inference';
import type { Expect, Equal } from './utils';
import LIVR = require('../../lib/LIVR');

/** Output type of a schema with one field */
type Field<Rules> = InferFromSchema<{ field: Rules }>;

declare module '../../types/inference' {
  interface RuleTypeRegistry {
    // Like examples/complex.ts before: camelCase names were declared by hand
    legacy_phone_number: RuleTypeDef<string, false, false>;
    legacyPhoneNumber: RuleTypeRegistry['legacy_phone_number'];

    legacy_required_string: RuleTypeDef<string, true, false>;
    legacy_must_have: RequiredRule;
    legacy_default_number: DefaultRule<number>;
    legacy_boolean: SimpleRule<boolean>;
    legacy_passthrough: RuleTypeDef<unknown, false, false>;
    legacy_function: ParameterizedRule<(value: string) => number>;
    legacy_namespace: LIVR.RuleTypeDef<Date, false, false>;

    // In both registries: ParameterizedRuleRegistry comes first, as before
    legacy_in_both: RuleTypeDef<number, false, false>;
    // In RuleTypes too: RuleTypes comes first
    legacy_and_new: RuleTypeDef<number, false, false>;
  }

  interface TemplateOutputRegistry<Args> {
    legacy_instance: Args extends abstract new (...args: any) => any ? InstanceType<Args> : unknown;
  }

  interface ParameterizedRuleRegistry {
    legacy_literal: ParameterizedRuleDef<'literal', false, false>;
    legacy_is: ParameterizedRuleDef<'literal', true, false>;
    legacy_enum: ParameterizedRuleDef<'array_element', false, false>;
    legacy_schema: ParameterizedRuleDef<'infer_schema', false, false>;
    legacy_schema_list: ParameterizedRuleDef<'infer_schema_array', false, false>;
    legacy_rule_list: ParameterizedRuleDef<'infer_rule_array', false, false>;
    legacy_instance_of: ParameterizedRuleDef<'legacy_instance', false, false>;
    legacy_default_of: ParameterizedRuleDef<'literal', false, true>;
    legacy_no_template: ParameterizedRuleDef<'no_such_template', false, false>;
    legacy_in_both: ParameterizedRuleDef<'literal', false, false>;
  }

  interface RuleTypes {
    legacy_and_new: As<string>;
  }
}

type _ruleTypeRegistry = [
  Expect<Equal<Field<'legacy_phone_number'>, { field?: string }>>,
  Expect<Equal<Field<'legacyPhoneNumber'>, { field?: string }>>,
  Expect<Equal<Field<['required', 'legacy_phone_number']>, { field: string }>>,
  Expect<Equal<Field<'legacy_required_string'>, { field: string }>>,
  Expect<Equal<Field<'legacy_default_number'>, { field: number }>>,
  Expect<Equal<Field<'legacy_boolean'>, { field?: boolean }>>,
  Expect<Equal<Field<'legacy_namespace'>, { field?: Date }>>,
  Expect<Equal<Field<'legacy_function'>, { field?: (value: string) => number }>>,
  // A type of an old rule replaces the type, literal types of earlier rules are not kept
  Expect<Equal<Field<[{ one_of: ['a'] }, 'legacy_phone_number']>, { field?: string }>>,
  Expect<Equal<Field<['string', 'legacy_passthrough']>, { field?: unknown }>>,
  // RequiredRule keeps the type, like `required`. It gave `unknown` after other rules before
  Expect<Equal<Field<'legacy_must_have'>, { field: unknown }>>,
  Expect<Equal<Field<['legacy_must_have', 'string']>, { field: string }>>,
  Expect<Equal<Field<['string', 'legacy_must_have']>, { field: string }>>,
];

type _parameterizedRuleRegistry = [
  Expect<Equal<Field<{ legacy_literal: 'x' }>, { field?: 'x' }>>,
  Expect<Equal<Field<{ legacy_is: 'active' }>, { field: 'active' }>>,
  Expect<Equal<Field<{ legacy_is: 42 }>, { field: 42 }>>,
  Expect<Equal<Field<{ legacy_enum: ['a', 'b'] }>, { field?: 'a' | 'b' }>>,
  Expect<Equal<Field<{ legacy_schema: { a: 'integer' } }>, { field?: { a?: number } }>>,
  Expect<
    Equal<Field<{ legacy_schema_list: { a: ['required', 'string'] } }>, { field?: { a: string }[] }>
  >,
  Expect<Equal<Field<{ legacy_rule_list: 'integer' }>, { field?: number[] }>>,
  Expect<Equal<Field<{ legacy_rule_list: ['required', 'integer'] }>, { field?: number[] }>>,
  Expect<Equal<Field<{ legacy_instance_of: DateConstructor }>, { field?: Date }>>,
  Expect<Equal<Field<{ legacy_default_of: 5 }>, { field: 5 }>>,
  Expect<Equal<Field<{ legacy_no_template: 5 }>, { field?: unknown }>>,
  // Arguments as written: the 'literal' template gets the whole array
  Expect<Equal<Field<{ legacy_literal: ['x'] }>, { field?: ['x'] }>>,
];

type _order = [
  Expect<Equal<Field<{ legacy_in_both: 'x' }>, { field?: 'x' }>>,
  Expect<Equal<Field<[{ one_of: ['a'] }, 'legacy_and_new']>, { field?: 'a' }>>,
];

// Old rules with built-in and new rules
type _mixed = [
  Expect<Equal<Field<{ list_of: 'legacy_phone_number' }>, { field?: string[] }>>,
  Expect<
    Equal<
      Field<{ nested_object: { id: { legacy_is: 1 }; at: 'legacy_namespace' } }>,
      { field?: { id: 1; at?: Date } }
    >
  >,
  Expect<Equal<Field<{ or: ['legacy_boolean', 'integer'] }>, { field?: boolean | number }>>,
  Expect<Equal<Field<['legacy_boolean', 'required']>, { field: boolean }>>,
];

// The registry interface is still exported, and its members can be referenced
type _registry = Expect<
  Equal<RuleTypeRegistry['legacy_boolean'], RuleTypeDef<boolean, false, false>>
>;
