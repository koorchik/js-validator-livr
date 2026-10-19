// t/tests-types/03-custom-rules.ts
// Types of custom rules and aliases (RuleTypes) - verified at compile time via `npx tsc --noEmit`
// Rule types are global: rules here have names of their own, other files test other names

import type {
  As,
  Present,
  RuleType,
  AliasType,
  BuiltInRuleTypes,
  InferFromSchema,
  InferRuleType,
  RuleTypeDef,
} from '../../types/inference';
import type { Expect, Equal } from './utils';
import LIVR = require('../../lib/LIVR');

/** Output type of a schema with one field */
type Field<Rules> = InferFromSchema<{ field: Rules }>;

// ============================================================================
// Rule types
// ============================================================================

/** { custom_currency: ['USD', 'EUR'] } -> 'USD' | 'EUR', from the arguments */
interface CurrencyType extends RuleType {
  output: this['args'][number];
}

/** { custom_instance_of: Date } -> Date */
interface InstanceOfType extends RuleType {
  output: this['args'][0] extends abstract new (...args: any) => infer T ? T : unknown;
}

/** { custom_pair: [min, max] } -> [min, max] from the second argument */
interface PairType extends RuleType {
  output: [this['args'][0], this['args'][1]];
}

/** A list of the value, from the type before the rule */
interface ToListType extends RuleType {
  output: this['input'] extends readonly unknown[] ? this['input'] : Array<this['input']>;
}

/** A custom meta rule: { custom_dict_of: rules } -> Record<string, type of the rules> */
interface DictOfType extends RuleType {
  output: Record<
    string,
    this['args'][0] extends infer Rules extends readonly unknown[]
      ? InferRuleType<Rules>
      : InferRuleType<this['args']>
  >;
}

/** A custom meta rule: { custom_list_of_objects: schema } with InferFromSchema */
interface ListOfObjectsType extends RuleType {
  output: Array<InferFromSchema<this['args'][0]>>;
}

/** Like `required`: the field is present, the type is kept */
interface MustHaveType extends RuleType {
  output: Exclude<this['input'], null | undefined>;
  present: true;
}

/** Present when the argument is true: { custom_present_if: true } */
interface PresentIfType extends RuleType {
  output: this['input'];
  present: this['args'][0] extends true ? true : false;
}

// Aliases
const phoneRules = ['string', { like: '^\\+?[0-9]{10,15}$' }] as const;
const requiredPhoneRules = ['required', 'custom_phone'] as const;
const statusRules = { one_of: ['active', 'blocked'] } as const;
const shortRules = { max_length: 2 } as const;
const addressRules = {
  nested_object: { city: ['required', 'string'], zip: 'positive_integer' },
} as const;

declare module '../../types/inference' {
  interface RuleTypes {
    custom_uuid: As<string>;
    custom_to_date: Date;
    custom_boolean: boolean;
    custom_checked: As<unknown>;
    custom_unique: As<unknown[]>;
    custom_now: Present<Date>;
    custom_currency: CurrencyType;
    custom_instance_of: InstanceOfType;
    custom_pair: PairType;
    custom_to_list: ToListType;
    custom_dict_of: DictOfType;
    custom_list_of_objects: ListOfObjectsType;
    custom_must_have: MustHaveType;
    custom_present_if: PresentIfType;
    custom_enum: BuiltInRuleTypes['one_of'];
    custom_any: any;

    custom_phone: AliasType<typeof phoneRules>;
    custom_required_phone: AliasType<typeof requiredPhoneRules>;
    custom_status: AliasType<typeof statusRules>;
    custom_short: AliasType<typeof shortRules>;
    custom_address: AliasType<typeof addressRules>;
    custom_local_alias: AliasType<['required', 'positive_integer']>;
  }
}

// ============================================================================
// Rules with a fixed type, As<T> and Present<T>
// ============================================================================

type _fixed = [
  Expect<Equal<Field<'custom_uuid'>, { field?: string }>>,
  Expect<Equal<Field<['required', 'custom_uuid']>, { field: string }>>,
  // As<string> keeps a narrower string type of earlier rules
  Expect<Equal<Field<[{ one_of: ['a', 'b'] }, 'custom_uuid']>, { field?: 'a' | 'b' }>>,
  Expect<Equal<Field<['integer', 'custom_uuid']>, { field?: string }>>,
  // A fixed type replaces the type
  Expect<Equal<Field<'custom_to_date'>, { field?: Date }>>,
  Expect<Equal<Field<['string', 'custom_to_date']>, { field?: Date }>>,
  Expect<Equal<Field<[{ one_of: ['true', 'false'] }, 'custom_boolean']>, { field?: boolean }>>,
  // As<unknown> only checks the value
  Expect<Equal<Field<'custom_checked'>, { field?: unknown }>>,
  Expect<Equal<Field<['integer', 'custom_checked']>, { field?: number }>>,
  Expect<Equal<Field<'custom_unique'>, { field?: unknown[] }>>,
  Expect<Equal<Field<[{ list_of: 'integer' }, 'custom_unique']>, { field?: number[] }>>,
  // Present<T>: the field is always present
  Expect<Equal<Field<'custom_now'>, { field: Date }>>,
  Expect<Equal<Field<['custom_now', 'iso_date']>, { field: string }>>,
  Expect<Equal<Field<'custom_must_have'>, { field: unknown }>>,
  Expect<Equal<Field<['integer', 'custom_must_have']>, { field: number }>>,
  Expect<Equal<Field<['integer', { custom_present_if: true }]>, { field: number }>>,
  Expect<Equal<Field<['integer', { custom_present_if: false }]>, { field?: number }>>,
  // any
  Expect<Equal<Field<'custom_any'>, { field?: any }>>,
  Expect<Equal<Field<['custom_any', 'required']>, { field: any }>>,
];

// ============================================================================
// Rule types from the arguments and from the type before the rule
// ============================================================================

type _computed = [
  Expect<Equal<Field<{ custom_currency: ['USD', 'EUR'] }>, { field?: 'USD' | 'EUR' }>>,
  Expect<Equal<Field<{ custom_currency: 'USD' }>, { field?: 'USD' }>>,
  Expect<Equal<Field<{ custom_instance_of: DateConstructor }>, { field?: Date }>>,
  Expect<Equal<Field<{ custom_pair: [1, 'a'] }>, { field?: [1, 'a'] }>>,
  Expect<Equal<Field<'custom_to_list'>, { field?: unknown[] }>>,
  Expect<Equal<Field<['integer', 'custom_to_list']>, { field?: number[] }>>,
  Expect<Equal<Field<[{ list_of: 'string' }, 'custom_to_list']>, { field?: string[] }>>,
  // Reusing a type of a built-in rule
  Expect<Equal<Field<{ custom_enum: ['a', 'b'] }>, { field?: 'a' | 'b' }>>,
  Expect<Equal<Field<{ custom_enum: [['a', 'b']] }>, { field?: 'a' | 'b' }>>,
];

// Custom meta rules with InferRuleType and InferFromSchema
type _customMeta = [
  Expect<Equal<Field<{ custom_dict_of: 'integer' }>, { field?: Record<string, number> }>>,
  Expect<
    Equal<
      Field<{ custom_dict_of: ['required', 'custom_uuid'] }>,
      { field?: Record<string, string> }
    >
  >,
  Expect<
    Equal<Field<{ custom_dict_of: [['required', 'integer']] }>, { field?: Record<string, number> }>
  >,
  Expect<
    Equal<
      Field<{ custom_list_of_objects: { id: ['required', 'custom_uuid'] } }>,
      { field?: { id: string }[] }
    >
  >,
  // Custom rules inside built-in meta rules
  Expect<
    Equal<
      Field<{ nested_object: { id: ['required', 'custom_uuid']; at: 'custom_to_date' } }>,
      { field?: { id: string; at?: Date } }
    >
  >,
  Expect<Equal<Field<{ list_of: 'custom_to_date' }>, { field?: Date[] }>>,
  Expect<Equal<Field<{ or: ['custom_to_date', 'integer'] }>, { field?: Date | number }>>,
];

// ============================================================================
// camelCase names of custom rules
// ============================================================================

type _camelCase = [
  Expect<Equal<Field<'customUuid'>, { field?: string }>>,
  Expect<Equal<Field<'customToDate'>, { field?: Date }>>,
  Expect<Equal<Field<{ customCurrency: ['USD'] }>, { field?: 'USD' }>>,
  Expect<Equal<Field<['required', 'customPhone']>, { field: string }>>,
];

// ============================================================================
// Aliases: the same type as their rules written in place
// ============================================================================

type _aliases = [
  Expect<Equal<Field<'custom_phone'>, Field<typeof phoneRules>>>,
  Expect<Equal<Field<'custom_phone'>, { field?: string }>>,
  // An alias with `required` makes the field present
  Expect<Equal<Field<'custom_required_phone'>, { field: string }>>,
  // An alias of a rule with arguments
  Expect<Equal<Field<'custom_status'>, { field?: 'active' | 'blocked' }>>,
  Expect<Equal<Field<['required', 'custom_status']>, { field: 'active' | 'blocked' }>>,
  // The alias gets the type of the value, like its rules written in place
  Expect<Equal<Field<[{ one_of: ['a', 'bb'] }, 'custom_short']>, { field?: 'a' | 'bb' }>>,
  Expect<Equal<Field<['integer', 'custom_short']>, { field?: string }>>,
  Expect<Equal<Field<'custom_address'>, { field?: { city: string; zip?: number } }>>,
  Expect<Equal<Field<{ list_of: 'custom_address' }>, { field?: { city: string; zip?: number }[] }>>,
  Expect<Equal<Field<'custom_local_alias'>, { field: number }>>,
];

// Alias rules are any rule definition: a name, a rule with arguments or a list of rules
LIVR.Validator.registerAliasedDefaultRule({ name: 'custom_phone', rules: phoneRules });
LIVR.Validator.registerAliasedDefaultRule({
  name: 'custom_required_phone',
  rules: requiredPhoneRules,
  error: 'WRONG_PHONE',
});
LIVR.Validator.registerAliasedDefaultRule({ name: 'custom_status', rules: statusRules });
LIVR.Validator.registerAliasedDefaultRule({ name: 'custom_short', rules: shortRules });
LIVR.Validator.registerAliasedDefaultRule({ name: 'custom_address', rules: addressRules });
LIVR.Validator.registerAliasedDefaultRule({ name: 'custom_required', rules: 'required' });
LIVR.Validator.registerAliasedDefaultRule({ name: 'custom_list', rules: ['required', 'string'] });

const validator = new LIVR.Validator<InferFromSchema<{ id: 'custom_local_alias' }>>({
  id: 'custom_local_alias',
});
validator.registerAliasedRule({
  name: 'custom_local_alias',
  rules: ['required', 'positive_integer'],
});

// ============================================================================
// Overriding built-in rules: RuleTypes comes first, like registerDefaultRules()
// ============================================================================

// Built-in rules of this test only, so that real built-in rules keep their types in other tests
declare module '../../types/inference' {
  interface BuiltInRuleTypes {
    test_builtin: As<string>;
    test_builtin_two: As<string>;
    test_builtin_three: As<string>;
  }

  interface RuleTypes {
    test_builtin: number;
    test_builtin_three: AliasType<['string', { max_length: 3 }, 'to_uc']>;
  }

  // Rules of older packages also come before the built-in rules
  interface RuleTypeRegistry {
    test_builtin_two: RuleTypeDef<Date>;
  }
}

type _overrides = [
  Expect<Equal<Field<'test_builtin'>, { field?: number }>>,
  Expect<Equal<Field<'testBuiltin'>, { field?: number }>>,
  Expect<Equal<Field<'test_builtin_two'>, { field?: Date }>>,
  Expect<Equal<Field<[{ one_of: ['a'] }, 'test_builtin_three']>, { field?: 'A' }>>,
  Expect<Equal<Field<'testBuiltinThree'>, { field?: string }>>,
];
