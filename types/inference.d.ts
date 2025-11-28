// types/inference.d.ts
// Core type inference engine for LIVR schemas

// ============================================================================
// Base Types
// ============================================================================

/** Primitive types that LIVR deals with */
export type LIVRPrimitive = string | number | boolean | null | undefined;

/** A single rule definition - can be string, object with args, or array of rules */
export type LIVRRuleDefinition =
  | string
  | { readonly [ruleName: string]: unknown }
  | readonly LIVRRuleDefinition[];

/** Schema is a record of field names to rule definitions */
export type LIVRSchema = { readonly [field: string]: LIVRRuleDefinition };

// ============================================================================
// Rule Type Registry (Extensible via Declaration Merging)
// ============================================================================

/**
 * Rule type definition structure.
 * Each rule must define its output type and effects on the field.
 */
export interface RuleTypeDef<
  TOutput = unknown,
  TRequiredEffect extends boolean = false,
  TDefaultEffect extends boolean = false
> {
  output: TOutput;
  requiredEffect: TRequiredEffect;
  defaultEffect: TDefaultEffect;
}

/**
 * Extensible registry for rule type definitions.
 * External packages can augment this interface to add custom rule types.
 *
 * @example
 * ```typescript
 * declare module 'livr/types/inference' {
 *   interface RuleTypeRegistry {
 *     my_rule: RuleTypeDef<string>;
 *   }
 * }
 * ```
 */
export interface RuleTypeRegistry {
  // Built-in rules are added by their respective .d.ts files
}

// ============================================================================
// Parameterized Rule Registry (Extensible via Declaration Merging)
// ============================================================================

/**
 * Extensible registry for template output computations.
 * External packages can augment this interface to add custom templates.
 *
 * @example
 * ```typescript
 * declare module 'livr/types/inference' {
 *   interface TemplateOutputRegistry<Args> {
 *     my_template: Args extends MyType ? TransformedType : unknown;
 *   }
 * }
 * ```
 */
export interface TemplateOutputRegistry<Args> {
  literal: Args;
  array_element: Args extends readonly (infer T)[] ? T : unknown;
  infer_schema: Args extends LIVRSchema ? InferFromSchema<Args> : unknown;
  infer_schema_array: Args extends LIVRSchema ? Array<InferFromSchema<Args>> : unknown;
  infer_rule_array: Args extends LIVRRuleDefinition ? Array<InferRuleType<Args>> : unknown;
}

/** Compute output type from template name and arguments */
type ComputeFromTemplate<Template extends string, Args> =
  Template extends keyof TemplateOutputRegistry<Args>
    ? TemplateOutputRegistry<Args>[Template]
    : unknown;

/**
 * Parameterized rule definition structure.
 * For rules where output type depends on arguments.
 */
export interface ParameterizedRuleDef<
  TTemplate extends string = string,
  TRequiredEffect extends boolean = false,
  TDefaultEffect extends boolean = false
> {
  template: TTemplate;
  requiredEffect: TRequiredEffect;
  defaultEffect: TDefaultEffect;
}

/**
 * Extensible registry for parameterized rules.
 * External packages can augment this to add custom parameterized rules.
 *
 * Built-in templates (see TemplateOutputRegistry):
 * - 'literal': Output = Args (for rules like `eq`)
 * - 'array_element': Output = element type of Args array (for rules like `one_of`)
 * - 'infer_schema': Output = InferFromSchema<Args> (for rules like `nested_object`)
 * - 'infer_schema_array': Output = Array<InferFromSchema<Args>> (for rules like `list_of_objects`)
 * - 'infer_rule_array': Output = Array<InferRuleType<Args>> (for rules like `list_of`)
 *
 * External packages can add custom templates via TemplateOutputRegistry augmentation.
 *
 * @example
 * ```typescript
 * declare module 'livr/types/inference' {
 *   // Add custom template
 *   interface TemplateOutputRegistry<Args> {
 *     my_template: Args extends SomeType ? OutputType : unknown;
 *   }
 *   // Register rule using the template
 *   interface ParameterizedRuleRegistry {
 *     my_rule: ParameterizedRuleDef<'my_template', false, false>;
 *   }
 * }
 * ```
 */
export interface ParameterizedRuleRegistry {
  // External packages augment this
}

/** Check if a rule is in the parameterized registry */
type IsInParameterizedRegistry<Name extends string> =
  Name extends keyof ParameterizedRuleRegistry ? true : false;

/** Get output from parameterized registry */
type GetParameterizedOutput<Name extends string, Args> =
  Name extends keyof ParameterizedRuleRegistry
    ? ParameterizedRuleRegistry[Name] extends { template: infer T extends string }
      ? ComputeFromTemplate<T, Args>
      : unknown
    : never;

/** Get required effect from parameterized registry */
type GetParameterizedRequiredEffect<Name extends string> =
  Name extends keyof ParameterizedRuleRegistry
    ? ParameterizedRuleRegistry[Name] extends { requiredEffect: infer R extends boolean }
      ? R
      : false
    : false;

/** Get default effect from parameterized registry */
type GetParameterizedDefaultEffect<Name extends string> =
  Name extends keyof ParameterizedRuleRegistry
    ? ParameterizedRuleRegistry[Name] extends { defaultEffect: infer D extends boolean }
      ? D
      : false
    : false;

// ============================================================================
// Schema Parsing Utilities
// ============================================================================

/** Normalize rule definition to array form */
type NormalizeRules<R> = R extends readonly unknown[] ? R : readonly [R];

/** Parse a single rule and extract name and args */
type ParseRule<R> =
  R extends string
    ? { name: R; args: undefined }
    : R extends { readonly [K in infer RuleName extends string]: infer Args }
      ? { name: RuleName; args: Args }
      : never;

/** Extract the first key from an object type */
type FirstKey<T> = T extends { readonly [K in infer Key extends string]: unknown }
  ? Key extends string ? Key : never
  : never;

// ============================================================================
// Type State Tracking
// ============================================================================

/** Tracks the current type and effects during rule chain processing */
interface TypeState {
  type: unknown;
  isRequired: boolean;
  hasDefault: boolean;
}

/** Initial type state before any rules are applied */
type InitialTypeState = {
  type: unknown;
  isRequired: false;
  hasDefault: false;
};

// ============================================================================
// Rule Output Computation
// ============================================================================

/**
 * Compute output type for parameterized rules.
 * This handles rules where the output type depends on the arguments.
 */
type ComputeParameterizedOutput<Name extends string, Args> =
  // one_of: output is union of array elements
  Name extends 'one_of' | 'oneOf'
    ? Args extends readonly (infer T)[] ? T : unknown
  // eq: output is the literal type of the argument
  : Name extends 'eq'
    ? Args
  // default: output is the type of the default value
  : Name extends 'default'
    ? Args
  // nested_object: output is inferred from nested schema
  : Name extends 'nested_object' | 'nestedObject'
    ? Args extends LIVRSchema ? InferFromSchema<Args> : unknown
  // list_of: output is array of inferred element type
  : Name extends 'list_of' | 'listOf'
    ? Args extends LIVRRuleDefinition ? Array<InferRuleType<Args>> : unknown
  // list_of_objects: output is array of inferred object type
  : Name extends 'list_of_objects' | 'listOfObjects'
    ? Args extends LIVRSchema ? Array<InferFromSchema<Args>> : unknown
  // list_of_different_objects: output is array of discriminated union
  : Name extends 'list_of_different_objects' | 'listOfDifferentObjects'
    ? Args extends readonly [infer D extends string, infer Schemas extends Record<string, LIVRSchema>]
      ? Array<{ [K in keyof Schemas]: Simplify<InferFromSchema<Schemas[K]> & { readonly [P in D]: K }> }[keyof Schemas]>
      : unknown
  // variable_object: output is discriminated union
  : Name extends 'variable_object' | 'variableObject'
    ? Args extends readonly [infer D extends string, infer Schemas extends Record<string, LIVRSchema>]
      ? { [K in keyof Schemas]: Simplify<InferFromSchema<Schemas[K]> & { readonly [P in D]: K }> }[keyof Schemas]
      : unknown
  // or: output is union of all rule outputs
  : Name extends 'or'
    ? Args extends readonly LIVRRuleDefinition[]
      ? InferOrUnion<Args>
      : unknown
  // Not a parameterized rule
  : never;

/** Helper to infer union type from 'or' rule arguments */
type InferOrUnion<Rules extends readonly LIVRRuleDefinition[]> =
  Rules extends readonly [infer First extends LIVRRuleDefinition, ...infer Rest extends readonly LIVRRuleDefinition[]]
    ? InferRuleType<First> | InferOrUnion<Rest>
    : never;

/** Check if a rule is parameterized (output depends on args) */
type IsParameterizedRule<Name extends string> =
  Name extends 'one_of' | 'oneOf' | 'eq' | 'default' | 'nested_object' | 'nestedObject'
    | 'list_of' | 'listOf' | 'list_of_objects' | 'listOfObjects'
    | 'list_of_different_objects' | 'listOfDifferentObjects'
    | 'variable_object' | 'variableObject' | 'or'
    ? true
    : false;

/** Get the output type for a known rule */
type GetRuleOutput<Name extends string, Args> =
  // First check extensible parameterized registry
  IsInParameterizedRegistry<Name> extends true
    ? GetParameterizedOutput<Name, Args>
  // Then check built-in parameterized rules (for backwards compatibility)
  : IsParameterizedRule<Name> extends true
    ? ComputeParameterizedOutput<Name, Args>
  // Finally look up in simple rule registry
  : Name extends keyof RuleTypeRegistry
    ? RuleTypeRegistry[Name] extends RuleTypeDef<infer O, any, any>
      ? O
      : unknown
    : unknown;

/** Check if a rule sets the required effect */
type GetRequiredEffect<Name extends string> =
  // First check parameterized registry
  IsInParameterizedRegistry<Name> extends true
    ? GetParameterizedRequiredEffect<Name>
  // Then check simple registry
  : Name extends keyof RuleTypeRegistry
    ? RuleTypeRegistry[Name] extends RuleTypeDef<any, infer R, any>
      ? R
      : false
    : false;

/** Check if a rule sets the default effect */
type GetDefaultEffect<Name extends string> =
  // First check parameterized registry
  IsInParameterizedRegistry<Name> extends true
    ? GetParameterizedDefaultEffect<Name>
  // Then check simple registry
  : Name extends keyof RuleTypeRegistry
    ? RuleTypeRegistry[Name] extends RuleTypeDef<any, any, infer D>
      ? D
      : false
    : false;

// ============================================================================
// Rule Chain Processing
// ============================================================================

/** Apply a single rule to the current type state */
type ApplyRule<Rule, State extends TypeState> =
  ParseRule<Rule> extends { name: infer N extends string; args: infer A }
    ? {
        type: [GetRuleOutput<N, A>] extends [never]
          ? State['type']  // Unknown rule, pass through
          : GetRuleOutput<N, A> extends unknown
            ? GetRuleOutput<N, A> extends never ? State['type'] : GetRuleOutput<N, A>
            : State['type'];
        isRequired: State['isRequired'] extends true ? true : GetRequiredEffect<N>;
        hasDefault: State['hasDefault'] extends true ? true : GetDefaultEffect<N>;
      }
    : State;

/** Process a chain of rules and determine final type state */
type ProcessRuleChain<Rules, State extends TypeState = InitialTypeState> =
  Rules extends readonly [infer First, ...infer Rest]
    ? ProcessRuleChain<Rest, ApplyRule<First, State>>
    : State;

// ============================================================================
// Optionality Handling
// ============================================================================

/** Determine if a field should be optional based on its type state */
type IsFieldOptional<State extends TypeState> =
  State['isRequired'] extends true
    ? false
    : State['hasDefault'] extends true
      ? false
      : true;

// ============================================================================
// Object Type Building
// ============================================================================

/** Process all fields in a schema to get their type states */
type ProcessAllFields<S extends LIVRSchema> = {
  [K in keyof S]: ProcessRuleChain<NormalizeRules<S[K]>>;
};

/** Extract required field keys from processed fields */
type RequiredKeys<Fields extends Record<string, TypeState>> = {
  [K in keyof Fields]: IsFieldOptional<Fields[K]> extends false ? K : never;
}[keyof Fields];

/** Extract optional field keys from processed fields */
type OptionalKeys<Fields extends Record<string, TypeState>> = {
  [K in keyof Fields]: IsFieldOptional<Fields[K]> extends true ? K : never;
}[keyof Fields];

/** Build the final object type with proper optionality */
type BuildObjectType<Fields extends Record<string, TypeState>> =
  { [K in RequiredKeys<Fields>]: Fields[K]['type'] } &
  { [K in OptionalKeys<Fields>]?: Fields[K]['type'] };

/** Simplify complex intersection types for better IDE display */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

// ============================================================================
// Main Inference Types
// ============================================================================

/**
 * Infer TypeScript type from a LIVR schema.
 *
 * @example
 * ```typescript
 * const schema = {
 *   name: ['required', 'string'],
 *   age: 'positive_integer',
 *   role: { one_of: ['admin', 'user'] as const },
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
 * Infer type from a single rule definition.
 * Useful for inferring element types in list_of rules.
 */
export type InferRuleType<R> = ProcessRuleChain<NormalizeRules<R>>['type'];

// ============================================================================
// Helper Types for Rule Definitions
// ============================================================================

/** Helper to define a simple rule that outputs a fixed type */
export type SimpleRule<T> = RuleTypeDef<T, false, false>;

/** Helper to define a rule that makes the field required */
export type RequiredRule = RuleTypeDef<unknown, true, false>;

/** Helper to define a rule with parameterized output */
export type ParameterizedRule<F> = RuleTypeDef<F, false, false>;

/** Helper to define a rule that provides a default value */
export type DefaultRule<T> = RuleTypeDef<T, false, true>;
