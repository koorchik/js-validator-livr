// types/inference.d.ts
// Core type inference engine for LIVR schemas

// Types of the built-in rules: every rule adds its type to BuiltInRuleTypes
/// <reference path="../lib/rules/common/required.d.ts" />
/// <reference path="../lib/rules/common/not_empty.d.ts" />
/// <reference path="../lib/rules/common/not_empty_list.d.ts" />
/// <reference path="../lib/rules/common/any_object.d.ts" />
/// <reference path="../lib/rules/string/string.d.ts" />
/// <reference path="../lib/rules/string/eq.d.ts" />
/// <reference path="../lib/rules/string/one_of.d.ts" />
/// <reference path="../lib/rules/string/max_length.d.ts" />
/// <reference path="../lib/rules/string/min_length.d.ts" />
/// <reference path="../lib/rules/string/length_equal.d.ts" />
/// <reference path="../lib/rules/string/length_between.d.ts" />
/// <reference path="../lib/rules/string/like.d.ts" />
/// <reference path="../lib/rules/numeric/integer.d.ts" />
/// <reference path="../lib/rules/numeric/positive_integer.d.ts" />
/// <reference path="../lib/rules/numeric/decimal.d.ts" />
/// <reference path="../lib/rules/numeric/positive_decimal.d.ts" />
/// <reference path="../lib/rules/numeric/max_number.d.ts" />
/// <reference path="../lib/rules/numeric/min_number.d.ts" />
/// <reference path="../lib/rules/numeric/number_between.d.ts" />
/// <reference path="../lib/rules/modifiers/default.d.ts" />
/// <reference path="../lib/rules/modifiers/trim.d.ts" />
/// <reference path="../lib/rules/modifiers/to_lc.d.ts" />
/// <reference path="../lib/rules/modifiers/to_uc.d.ts" />
/// <reference path="../lib/rules/modifiers/remove.d.ts" />
/// <reference path="../lib/rules/modifiers/leave_only.d.ts" />
/// <reference path="../lib/rules/special/email.d.ts" />
/// <reference path="../lib/rules/special/url.d.ts" />
/// <reference path="../lib/rules/special/iso_date.d.ts" />
/// <reference path="../lib/rules/special/equal_to_field.d.ts" />
/// <reference path="../lib/rules/meta/nested_object.d.ts" />
/// <reference path="../lib/rules/meta/list_of.d.ts" />
/// <reference path="../lib/rules/meta/list_of_objects.d.ts" />
/// <reference path="../lib/rules/meta/list_of_different_objects.d.ts" />
/// <reference path="../lib/rules/meta/variable_object.d.ts" />
/// <reference path="../lib/rules/meta/or.d.ts" />

// ============================================================================
// Base Types
// ============================================================================

/** Primitive types that LIVR deals with */
export type LIVRPrimitive = string | number | boolean | null | undefined;

/**
 * Rules of a field: a rule or a list of rules. A rule is a name, or an object with the name
 * and the arguments. In strict mode only rules with a type (RuleName)
 */
export type LIVRRuleDefinition = IsStrictRules extends true
  ? StrictRuleDefinition
  : AnyRuleDefinition;

/** Schema is a record of field names to rule definitions. In strict mode only rules with a type */
export type LIVRSchema = IsStrictRules extends true ? StrictSchema : AnySchema;

/** Any rules, for the inference engine: it reads every schema, in strict mode too */
type AnyRuleDefinition =
  string | { readonly [ruleName: string]: unknown } | readonly AnyRuleDefinition[];

type AnySchema = { readonly [field: string]: AnyRuleDefinition };

// ============================================================================
// Type Options (Set via Declaration Merging)
// ============================================================================

/**
 * Options of the LIVR types, set by the application with declaration merging.
 *
 * `strictRules: true` is the strict mode: every rule in a schema must have a type, a rule
 * without a type is a compile error. It catches a forgotten type of a custom rule or an alias
 * and a misspelled rule name, which would give `unknown` otherwise. Checked in the schemas of
 * validators, in aliases, in the names of registered rules and aliases, and with
 * `satisfies LIVRSchema`. Rules inside the arguments of meta rules are checked too.
 *
 * @example
 * ```typescript
 * declare module 'livr/types/inference' {
 *   interface TypeOptions {
 *     strictRules: true;
 *   }
 * }
 * ```
 */
export interface TypeOptions {
  // strictRules: true
}

/** `strictRules: true` in TypeOptions */
type IsStrictRules = TypeOptions extends { readonly strictRules: true } ? true : false;

// ============================================================================
// Rule Types (Extensible via Declaration Merging)
// ============================================================================

/**
 * Types of your rules by rule name: the type of the value after the rule.
 * Your rules, aliases and rule packages add their types here with declaration merging, so any
 * number of packages can add rules. A type here replaces the type of a built-in rule with the
 * same name, like registerDefaultRules() replaces the rule. camelCase names (`myRule` for
 * `my_rule`) are found automatically, like the validator registers them.
 *
 * A member is one of:
 * - `As<T>`: the rule checks or converts the value to T, and keeps a narrower T from earlier
 *   rules. `As<unknown>` for a rule that only checks the value and keeps its type
 * - the type itself, when the rule always gives it: `to_date: Date`
 * - `AliasType<typeof rules>` for an alias
 * - an interface that extends RuleType, when the type depends on the rule arguments
 *   or on the type of the value before the rule
 *
 * `Present<T>` for a rule that always gives T and makes the field present, like `default`.
 * In an interface that extends RuleType, `present: true` makes the field present, like `required`.
 *
 * @example
 * ```typescript
 * import type { As, RuleType } from 'livr/types/inference';
 *
 * // { currency: ['USD', 'EUR'] } -> 'USD' | 'EUR'
 * interface CurrencyType extends RuleType {
 *   output: this['args'][number];
 * }
 *
 * declare module 'livr/types/inference' {
 *   interface RuleTypes {
 *     uuid: As<string>;
 *     to_date: Date;
 *     currency: CurrencyType;
 *   }
 * }
 * ```
 */
export interface RuleTypes {
  // Your rules, aliases and rule packages add their types here
}

/**
 * Types of the built-in rules, added by the .d.ts file of every rule in lib/rules.
 * Add types of your rules to RuleTypes: it also overrides the types here.
 * Reuse a type of a built-in rule as `BuiltInRuleTypes['one_of']`.
 */
export interface BuiltInRuleTypes {
  // Built-in rules are added by their respective .d.ts files
}

declare const ruleTypeBrand: unique symbol;

/**
 * Base of rule types that depend on the rule arguments or on the type of the value before
 * the rule. Set `output` from:
 * - `this['args']`: the rule arguments, as the rule function gets them:
 *   `{ eq: 'a' }` -> `['a']`, `{ length_between: [1, 10] }` -> `[1, 10]`, `'string'` -> `[]`.
 *   Read them by index, `this['args'][0]` or `this['args'][number]`: inside the interface they
 *   are an intersection with `readonly unknown[]`, so `infer` on the tuple gives wrong types
 * - `this['input']`: the type of the value before the rule, `unknown` for the first rule
 *
 * Set `present: true` when the field is always present after the rule, like after `required`.
 * It is a flag, not a part of `output`: the field type is computed only when it is used,
 * so deeply nested schemas stay cheap.
 *
 * Set `params` to the types of the arguments, as a tuple like `this['args']`, to check them in
 * strict mode (TypeOptions). Meta rules set it, so that the rules in their arguments are checked
 * too: `params: readonly [schema: LIVRSchema]`. A single argument can also be written without
 * the array, like the validator takes it.
 *
 * @example
 * ```typescript
 * // { instance_of: Date } -> Date
 * interface InstanceOfType extends RuleType {
 *   output: this['args'][0] extends abstract new (...args: any) => infer T ? T : unknown;
 * }
 *
 * // { is: 'active' } -> 'active', the field is required
 * interface IsType extends RuleType {
 *   output: this['args'][0];
 *   present: true;
 * }
 * ```
 */
export interface RuleType {
  readonly [ruleTypeBrand]: true;
  readonly args: readonly unknown[];
  readonly input: unknown;
  readonly output: unknown;
  readonly present?: boolean;
  readonly params?: readonly unknown[];
}

/**
 * A rule that always gives T and makes the field present in the output, like `default`:
 * the field is not optional then. In an interface that extends RuleType, set `present: true`.
 */
export interface Present<T> extends RuleType {
  output: T;
  present: true;
}

/**
 * A rule that checks or converts the value to T. A narrower T from earlier rules is kept:
 * with `max_length: As<string>`, `[{ one_of: ['a', 'b'] }, { max_length: 1 }]` stays 'a' | 'b'.
 * `As<unknown>` keeps any type, for rules that only check the value.
 */
export interface As<T> extends RuleType {
  output: this['input'] extends T ? this['input'] : T;
}

/**
 * Type of an alias: the same type as its rules written in place.
 *
 * @example
 * ```typescript
 * const phoneRules = ['string', { like: '^\\+?[0-9]{10,15}$' }] as const;
 * LIVR.Validator.registerAliasedDefaultRule({ name: 'phone', rules: phoneRules });
 *
 * declare module 'livr/types/inference' {
 *   interface RuleTypes {
 *     phone: AliasType<typeof phoneRules>;
 *   }
 * }
 * ```
 */
export interface AliasType<Rules> extends RuleType {
  output: InferRuleType<Rules, this['input']>;
  present: MakesPresent<Rules, this['input']>;
}

// ============================================================================
// Schema Parsing Utilities
// ============================================================================

/**
 * Rebuild a tuple by indexes. `this['args']` is `readonly unknown[] & [...]`,
 * and `infer` in `[infer First, ...infer Rest]` does not work on it
 */
type CleanTuple<
  T extends readonly unknown[],
  Result extends unknown[] = [],
> = number extends T['length']
  ? T
  : Result['length'] extends T['length']
    ? Result
    : CleanTuple<T, [...Result, T[Result['length']]]>;

/** Normalize rule definition to array form */
type NormalizeRules<R> = R extends readonly unknown[] ? CleanTuple<R> : readonly [R];

/**
 * Parse a single rule: its name, the arguments as written (for the deprecated registries)
 * and as the rule function gets them, like BaseValidator._parseRule()
 */
type ParseRule<R> = R extends string
  ? { name: R; rawArgs: undefined; args: [] }
  : R extends { readonly [K in infer RuleName extends string]: infer Args }
    ? { name: RuleName; rawArgs: Args; args: Args extends readonly unknown[] ? Args : [Args] }
    : never;

interface ParsedRule {
  name: string;
  rawArgs: unknown;
  args: readonly unknown[];
}

// ============================================================================
// Rule Output Computation
// ============================================================================

/** snake_case to camelCase, like util.camelize() */
type Camelize<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<Camelize<Tail>>}`
  : S;

/** A registry by camelCase names: the validator registers rules under both names */
type CamelCaseKeys<Registry> = {
  [K in keyof Registry as K extends string ? Camelize<K> : never]: Registry[K];
};

// ============================================================================
// Strict Mode: Rules With a Type
// ============================================================================

/**
 * Names of the rules with a type: RuleTypes, the deprecated registries and BuiltInRuleTypes,
 * camelCase names too. In strict mode a schema can only have these rules
 */
export type RuleName = Extract<
  | keyof RuleTypes
  | keyof CamelCaseKeys<RuleTypes>
  | keyof ParameterizedRuleRegistry
  | keyof RuleTypeRegistry
  | keyof BuiltInRuleTypes
  | keyof CamelCaseKeys<BuiltInRuleTypes>,
  string
>;

/** The type of a rule by its name, in the same order as GetRuleResult */
type RuleTypeByName<Name> = Name extends keyof RuleTypes
  ? RuleTypes[Name]
  : Name extends keyof CamelCaseKeys<RuleTypes>
    ? CamelCaseKeys<RuleTypes>[Name]
    : Name extends keyof ParameterizedRuleRegistry | keyof RuleTypeRegistry
      ? unknown
      : Name extends keyof BuiltInRuleTypes
        ? BuiltInRuleTypes[Name]
        : Name extends keyof CamelCaseKeys<BuiltInRuleTypes>
          ? CamelCaseKeys<BuiltInRuleTypes>[Name]
          : unknown;

/** Arguments of a rule as written: `params` of its type, also a single argument without the array */
type RuleArgs<T> = 0 extends 1 & T
  ? unknown
  : T extends { readonly params: infer Params extends readonly unknown[] }
    ? Params | SingleArg<Params>
    : unknown;

/** `{ rule: arg }` for `{ rule: [arg] }`, when the rule takes one argument or a list of them */
type SingleArg<Params> = Params extends readonly unknown[]
  ? number extends Params['length']
    ? Exclude<Params[number], readonly unknown[]>
    : Params extends readonly [infer Only]
      ? Exclude<Only, readonly unknown[]>
      : never
  : never;

/**
 * A rule with arguments, `{ name: args }`, in strict mode. Without `length`: a string has
 * methods like the rule `trim`, an array like `sort`, so they would be rule objects otherwise
 */
type StrictRuleObject = {
  readonly [Name in RuleName | 'length']?: Name extends 'length'
    ? never
    : RuleArgs<RuleTypeByName<Name>>;
};

/** A single rule in strict mode */
type StrictRule = RuleName | StrictRuleObject;

type StrictRuleDefinition = StrictRule | readonly StrictRule[];

type StrictSchema = { readonly [field: string]: StrictRuleDefinition };

/** A rule without a type: the value after it is unknown */
interface UnknownRuleResult {
  readonly output: unknown;
  readonly present: false;
}

/**
 * A rule type with its arguments and the type of the value before the rule. The type before
 * the rule is read from the state only when the rule type uses it
 */
type ResolveRuleType<T, Args, State extends TypeState> = 0 extends 1 & T
  ? { readonly output: any; readonly present: false } // `my_rule: any`
  : T extends RuleType
    ? T & { readonly args: Args; readonly input: State['type'] }
    : { readonly output: T; readonly present: false };

/**
 * Get the type of a rule. Like the validator, rules registered by you and rule packages
 * come before the built-in ones: RuleTypes, then the deprecated registries, then BuiltInRuleTypes
 */
type GetRuleResult<
  Rule extends ParsedRule,
  State extends TypeState,
> = Rule['name'] extends keyof RuleTypes
  ? ResolveRuleType<RuleTypes[Rule['name']], Rule['args'], State>
  : Rule['name'] extends keyof CamelCaseKeys<RuleTypes>
    ? ResolveRuleType<CamelCaseKeys<RuleTypes>[Rule['name']], Rule['args'], State>
    : Rule['name'] extends keyof ParameterizedRuleRegistry | keyof RuleTypeRegistry
      ? LegacyRuleResult<Rule['name'], Rule['rawArgs'], State>
      : Rule['name'] extends keyof BuiltInRuleTypes
        ? ResolveRuleType<BuiltInRuleTypes[Rule['name']], Rule['args'], State>
        : Rule['name'] extends keyof CamelCaseKeys<BuiltInRuleTypes>
          ? ResolveRuleType<CamelCaseKeys<BuiltInRuleTypes>[Rule['name']], Rule['args'], State>
          : UnknownRuleResult;

// ============================================================================
// Rule Chain Processing
// ============================================================================

/** Tracks the current type and presence of the field during rule chain processing */
interface TypeState {
  type: unknown;
  isPresent: boolean;
}

/** Initial type state before any rules are applied */
type InitialTypeState = {
  type: unknown;
  isPresent: false;
};

/**
 * The state after a rule. An object type, so that its members are computed only when they are
 * read: a nested object is not computed while the parent object is (TypeScript would stop at
 * a few levels of nesting with "Type instantiation is excessively deep")
 */
type NextState<Result, State extends TypeState> = {
  type: Result extends { readonly output: infer Output }
    ? [Output] extends [never]
      ? State['type'] // No type for these arguments
      : Output
    : unknown;
  isPresent: State['isPresent'] extends true
    ? true
    : Result extends { readonly present: true }
      ? true
      : false;
};

/** Apply a single rule to the current type state */
type ApplyRule<Rule, State extends TypeState> = [ParseRule<Rule>] extends [never]
  ? State
  : ParseRule<Rule> extends infer Parsed extends ParsedRule
    ? NextState<GetRuleResult<Parsed, State>, State>
    : State;

/** Process a chain of rules and determine final type state */
type ProcessRuleChain<Rules, State extends TypeState = InitialTypeState> = Rules extends readonly [
  infer First,
  ...infer Rest,
]
  ? ProcessRuleChain<Rest, ApplyRule<First, State>>
  : State;

// ============================================================================
// Object Type Building
// ============================================================================

/** Process all fields in a schema to get their type states */
type ProcessAllFields<S extends AnySchema> = {
  [K in keyof S]: ProcessRuleChain<NormalizeRules<S[K]>>;
};

/** Extract required field keys from processed fields */
type RequiredKeys<Fields extends Record<string, TypeState>> = {
  [K in keyof Fields]: Fields[K]['isPresent'] extends true ? K : never;
}[keyof Fields];

/** Extract optional field keys from processed fields */
type OptionalKeys<Fields extends Record<string, TypeState>> = {
  [K in keyof Fields]: Fields[K]['isPresent'] extends true ? never : K;
}[keyof Fields];

/** Build the final object type with proper optionality */
type BuildObjectType<Fields extends Record<string, TypeState>> = {
  [K in RequiredKeys<Fields>]: Fields[K]['type'];
} & { [K in OptionalKeys<Fields>]?: Fields[K]['type'] };

/** Simplify complex intersection types for better IDE display */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

// ============================================================================
// Main Inference Types
// ============================================================================

/**
 * Infer TypeScript type from a LIVR schema.
 * Also for meta rules: `nested_object` gives `InferFromSchema<this['args'][0]>`.
 *
 * @example
 * ```typescript
 * const schema = {
 *   name: ['required', 'string'],
 *   age: 'positive_integer',
 *   role: { one_of: ['admin', 'user'] },
 * } as const;
 *
 * type User = InferFromSchema<typeof schema>;
 * // { name: string; age?: number; role?: 'admin' | 'user' }
 * ```
 */
export type InferFromSchema<S> = S extends AnySchema
  ? Simplify<BuildObjectType<ProcessAllFields<S>>>
  : never;

/**
 * Type of a value after a rule or a list of rules, for a value of type Input before them.
 * Also for meta rules: items of `list_of` are `InferRuleType<rules>`
 */
export type InferRuleType<Rules, Input = unknown> =
  ProcessRuleChain<NormalizeRules<Rules>, { type: Input; isPresent: false }> extends {
    type: infer T;
  }
    ? T
    : never;

/**
 * `true` when the rules make the field always present, like `required`.
 * With InferRuleType, for meta rules that run rules on their value, like `or` and AliasType
 */
export type MakesPresent<Rules, Input = unknown> =
  ProcessRuleChain<NormalizeRules<Rules>, { type: Input; isPresent: false }> extends {
    isPresent: true;
  }
    ? true
    : false;

// ============================================================================
// Deprecated Registries (still read, before the built-in rule types)
// ============================================================================

/**
 * @deprecated Add the rule to RuleTypes: `my_rule: As<string>` or `my_rule: string`,
 * `Present<T>` for a rule that makes the field present. See the migration guide in TYPESCRIPT.md
 */
export interface RuleTypeDef<
  TOutput = unknown,
  TRequiredEffect extends boolean = false,
  TDefaultEffect extends boolean = false,
> {
  output: TOutput;
  requiredEffect: TRequiredEffect;
  defaultEffect: TDefaultEffect;
}

/**
 * @deprecated Use RuleTypes, which also finds camelCase names. Built-in rules are not listed
 * here anymore: they are in BuiltInRuleTypes
 */
export interface RuleTypeRegistry {
  // Rules of older rule packages
}

/** @deprecated Use RuleTypes with an interface that extends RuleType */
export interface TemplateOutputRegistry<Args> {
  literal: Args;
  array_element: Args extends readonly (infer T)[] ? T : unknown;
  infer_schema: Args extends AnySchema ? InferFromSchema<Args> : unknown;
  infer_schema_array: Args extends AnySchema ? Array<InferFromSchema<Args>> : unknown;
  infer_rule_array: Args extends AnyRuleDefinition ? Array<InferRuleType<Args>> : unknown;
}

/** @deprecated Use RuleTypes with an interface that extends RuleType */
export interface ParameterizedRuleDef<
  TTemplate extends string = string,
  TRequiredEffect extends boolean = false,
  TDefaultEffect extends boolean = false,
> {
  template: TTemplate;
  requiredEffect: TRequiredEffect;
  defaultEffect: TDefaultEffect;
}

/** @deprecated Use RuleTypes with an interface that extends RuleType */
export interface ParameterizedRuleRegistry {
  // Rules of older rule packages
}

/** @deprecated `my_rule: string` or `my_rule: As<string>` in RuleTypes */
export type SimpleRule<T> = RuleTypeDef<T, false, false>;

/** @deprecated An interface that extends RuleType with `present: true`, see the type of `required` */
export type RequiredRule = RuleTypeDef<unknown, true, false>;

/** @deprecated Use RuleTypes with an interface that extends RuleType */
export type ParameterizedRule<F> = RuleTypeDef<F, false, false>;

/** @deprecated `my_rule: Present<T>` in RuleTypes */
export type DefaultRule<T> = RuleTypeDef<T, false, true>;

/** Compute output type from template name and arguments */
type ComputeFromTemplate<
  Template extends string,
  Args,
> = Template extends keyof TemplateOutputRegistry<Args>
  ? TemplateOutputRegistry<Args>[Template]
  : unknown;

/** A rule from the deprecated registries, with the arguments as written */
type LegacyRuleResult<
  Name extends string,
  RawArgs,
  State extends TypeState,
> = Name extends keyof ParameterizedRuleRegistry
  ? FromLegacyDef<
      ParameterizedRuleRegistry[Name],
      ParameterizedRuleRegistry[Name] extends { template: infer T extends string }
        ? ComputeFromTemplate<T, RawArgs>
        : unknown,
      State
    >
  : Name extends keyof RuleTypeRegistry
    ? FromLegacyDef<
        RuleTypeRegistry[Name],
        RuleTypeRegistry[Name] extends { output: infer O } ? O : unknown,
        State
      >
    : UnknownRuleResult;

/**
 * A deprecated definition as a rule result: the effects make the field present.
 * A required rule with the `unknown` output (RequiredRule) keeps the type, like `required`
 */
type FromLegacyDef<Def, Output, State extends TypeState> = Def extends { requiredEffect: true }
  ? {
      readonly output: 0 extends 1 & Output
        ? Output
        : unknown extends Output
          ? State['type']
          : Output;
      readonly present: true;
    }
  : {
      readonly output: Output;
      readonly present: Def extends { defaultEffect: true } ? true : false;
    };
