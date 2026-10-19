// types/inference.d.ts
// Core type inference engine for LIVR schemas

// ============================================================================
// Base Types
// ============================================================================

/** Primitive types that LIVR deals with */
export type LIVRPrimitive = string | number | boolean | null | undefined;

/** A single rule definition - can be string, object with args, or array of rules */
export type LIVRRuleDefinition =
  string | { readonly [ruleName: string]: unknown } | readonly LIVRRuleDefinition[];

/** Schema is a record of field names to rule definitions */
export type LIVRSchema = { readonly [field: string]: LIVRRuleDefinition };

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
type ProcessAllFields<S extends LIVRSchema> = {
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
export type InferFromSchema<S> = S extends LIVRSchema
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
  infer_schema: Args extends LIVRSchema ? InferFromSchema<Args> : unknown;
  infer_schema_array: Args extends LIVRSchema ? Array<InferFromSchema<Args>> : unknown;
  infer_rule_array: Args extends LIVRRuleDefinition ? Array<InferRuleType<Args>> : unknown;
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
