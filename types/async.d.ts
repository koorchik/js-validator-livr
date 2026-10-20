// types/async.d.ts
// Types of 'livr/async': AsyncValidator, rules may return promises
// Docs: https://js.livr-spec.org, for AI assistants: https://js.livr-spec.org/llms.txt
// Custom rules and their types: https://js.livr-spec.org/guide/custom-rules

import LIVR = require('./index');
import type {
  Alias,
  AsyncRuleFactory,
  RuleFactories,
  Util,
  ValidatorOptions,
  ValidatorSchema,
} from './common';

declare namespace LIVRAsync {
  /**
   * A validator with rules that may return promises: rules that query a database or an API.
   * Fields are validated in parallel, the rules of a field one after another. The schema and
   * the types are the same as with Validator of 'livr'.
   */
  class AsyncValidator<T = any> {
    /**
     * Constructs a new validator with a given rules object.
     *
     * @param rules An object describing the validation rules.
     * @param options `{ autoTrim: true }` trims all strings of the data, or `autoTrim` as a boolean.
     */
    constructor(rules: ValidatorSchema, options?: ValidatorOptions);

    /**
     * Prepares the validator (compiles rules, etc.). validate() calls it on the first validation.
     *
     * @returns The validator instance itself.
     */
    prepare(): this;

    /**
     * Returns all rules of a schema field as one rule function, prepared once. The rules run
     * like in validate(): in order, each gets the output of the previous one. The function
     * returns an error code or undefined, a promise of it only when a rule returns a promise.
     * Like any rule, it pushes the output value to outputArr only when the rules change the
     * value. For custom meta rules that validate many values with the same rules.
     *
     * @param fieldName A field of the schema.
     */
    getFieldRule(fieldName: string): (value: any, allValues: any, outputArr: Array<any>) => any;

    /**
     * Validates the data.
     *
     * @param data The object to validate.
     * @returns A promise of the validated data. It rejects with the errors object, shaped like
     * the data, or with 'FORMAT_ERROR' when the data is not an object.
     */
    validate(data: unknown): Promise<T>;

    /**
     * Register custom rules locally (for a single validator). A rule gets the rule arguments and
     * returns a function `(value, allValues, outputArr)` that returns an error code, undefined
     * when the value is valid, or a promise of it. Registering a rule does not give it a type:
     * declare the type in RuleTypes of 'livr/types/inference'.
     * https://js.livr-spec.org/guide/custom-rules
     */
    registerRules(rules: RuleFactories<AsyncRuleFactory>): this;

    /**
     * Register aliased rule locally (for a single validator). Registering an alias does not give
     * it a type: declare `name: AliasType<typeof rules>` in RuleTypes of 'livr/types/inference'.
     * https://js.livr-spec.org/guide/custom-rules
     */
    registerAliasedRule(alias: Alias): this;

    /**
     * The rules registered for this validator with registerRules() and registerAliasedRule().
     */
    getRules(): Record<string, AsyncRuleFactory>;

    // -----------------------------------------------
    // Static Methods (Global Config & Rule Management)
    // -----------------------------------------------

    /**
     * Globally enable or disable auto-trim of strings.
     */
    static defaultAutoTrim(state: boolean): void;

    /**
     * Register custom rules as default rules, for all validators. They are shared with Validator
     * of 'livr', rules that return promises work only in AsyncValidator. Registering a rule does
     * not give it a type: declare the type in RuleTypes of 'livr/types/inference'.
     * https://js.livr-spec.org/guide/custom-rules
     */
    static registerDefaultRules(rules: RuleFactories<AsyncRuleFactory>): void;

    /**
     * Register an alias as a default rule, shared with Validator of 'livr'. Registering an alias
     * does not give it a type: declare `name: AliasType<typeof rules>` in RuleTypes of
     * 'livr/types/inference'. https://js.livr-spec.org/guide/custom-rules
     */
    static registerAliasedDefaultRule(alias: Alias): void;

    /**
     * Retrieve the map of all default rules: built-in and registered ones.
     */
    static getDefaultRules(): Record<string, AsyncRuleFactory>;
  }

  /** The built-in rules, with the async versions of the meta rules */
  export const rules: Record<string, AsyncRuleFactory>;

  /** Helpers for rules */
  export const util: Util;

  // Type inference exports, the same as in 'livr'
  export type InferFromSchema<S> = LIVR.InferFromSchema<S>;
  export type InferRuleType<Rules, Input = unknown> = LIVR.InferRuleType<Rules, Input>;
  export type MakesPresent<Rules, Input = unknown> = LIVR.MakesPresent<Rules, Input>;
  export type LIVRSchema = LIVR.LIVRSchema;
  export type LIVRRuleDefinition = LIVR.LIVRRuleDefinition;
  export type LIVRPrimitive = LIVR.LIVRPrimitive;
  export type Simplify<T> = LIVR.Simplify<T>;

  // Types of rules. Add types of your rules to RuleTypes in 'livr/types/inference'
  export type RuleTypes = LIVR.RuleTypes;
  export type BuiltInRuleTypes = LIVR.BuiltInRuleTypes;
  export type RuleName = LIVR.RuleName;
  export type TypeOptions = LIVR.TypeOptions;
  export type RuleType = LIVR.RuleType;
  export type Present<T> = LIVR.Present<T>;
  export type As<T> = LIVR.As<T>;
  export type AliasType<Rules> = LIVR.AliasType<Rules>;
}

export = LIVRAsync;
