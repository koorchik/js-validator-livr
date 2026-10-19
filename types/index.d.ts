// types/index.d.ts

// Import rule type definitions (declaration merging)
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

import {
  InferFromSchema as _InferFromSchema,
  InferRuleType as _InferRuleType,
  MakesPresent as _MakesPresent,
  LIVRSchema as _LIVRSchema,
  LIVRRuleDefinition as _LIVRRuleDefinition,
  LIVRPrimitive as _LIVRPrimitive,
  RuleTypes as _RuleTypes,
  BuiltInRuleTypes as _BuiltInRuleTypes,
  RuleType as _RuleType,
  Present as _Present,
  As as _As,
  AliasType as _AliasType,
  RuleTypeDef as _RuleTypeDef,
  RuleTypeRegistry as _RuleTypeRegistry,
  ParameterizedRuleDef as _ParameterizedRuleDef,
  ParameterizedRuleRegistry as _ParameterizedRuleRegistry,
  Simplify as _Simplify,
  SimpleRule as _SimpleRule,
  RequiredRule as _RequiredRule,
  ParameterizedRule as _ParameterizedRule,
  DefaultRule as _DefaultRule,
} from './inference';

type Schema = Record<string, any>;

interface Alias {
  name: string;
  rules: _LIVRRuleDefinition | Schema;
  error?: string;
}

type RuleFactory = (
  ...args: Array<any>
) => (value: any, params: any, outputArr: Array<any>) => string | undefined;

declare namespace LIVR {
  /**
   * Main Validator class from LIVR.
   */
  class Validator<T = any> {
    /**
     * Constructs a new validator with a given rules object.
     *
     * @param rules An object describing the validation rules.
     */
    constructor(rules: Record<string, any>);

    /**
     * Prepares the validator (compiles rules, etc.).
     * Often called immediately after constructor.
     *
     * @returns The validator instance itself.
     */
    prepare(): this;

    /**
     * Returns all rules of a schema field as one rule function, prepared once.
     * The rules run like in validate(): in order, each gets the output of the previous one.
     * The function returns an error code or undefined. Like any rule, it pushes the output
     * value to outputArr only when the rules change the value, so a missing value stays
     * missing. For custom meta rules that validate many values with the same rules.
     *
     * @param fieldName A field of the schema.
     */
    getFieldRule(fieldName: string): (value: any, allValues: any, outputArr: Array<any>) => any;

    /**
     * Validates the provided data against the prepared rules.
     *
     * @param data The object (or primitive) to validate.
     * @returns The validated data if validation passes, or `false` if validation fails.
     */
    validate(data: unknown): T | false;

    /**
     * Returns validation errors if validation has failed, or `null` if there were no errors.
     */
    getErrors(): Record<string, any> | null;

    /**
     * Register custom rules locally (for a single Validator instance).
     */
    registerRules(rules: Record<string, RuleFactory>): this;

    /**
     * Register aliased rule locally (for a single Validator instance).
     */
    registerAliasedRule(alias: Alias): this;

    /**
     * Retrieve the map of all locally registered rules.
     */
    getAliasedRule(): Record<string, any>;

    // -----------------------------------------------
    // Static Methods (Global Config & Rule Management)
    // -----------------------------------------------

    /**
     * Globally enable or disable auto-trim of strings.
     */
    static defaultAutoTrim(state: boolean): void;

    /**
     * Register custom rules as default rules.
     */
    static registerDefaultRules(rules: Record<string, RuleFactory>): void;

    /**
     * Register multiple "aliased" default rules (commonly used for advanced or compound rules).
     */
    static registerAliasedDefaultRule(alias: Alias): void;

    /**
     * Retrieve the map of all globally registered default rules.
     */
    static getDefaultRules(): Record<string, RuleFactory>;
  }

  /**
   * A specialized Error object thrown or used by the validator to store errors.
   */
  class ValidatorError extends Error {
    constructor(errors: Record<string, any>);
    getErrors(): Record<string, any>;
  }

  // Type inference exports
  export type InferFromSchema<S> = _InferFromSchema<S>;
  export type InferRuleType<Rules, Input = unknown> = _InferRuleType<Rules, Input>;
  export type MakesPresent<Rules, Input = unknown> = _MakesPresent<Rules, Input>;
  export type LIVRSchema = _LIVRSchema;
  export type LIVRRuleDefinition = _LIVRRuleDefinition;
  export type LIVRPrimitive = _LIVRPrimitive;
  export type Simplify<T> = _Simplify<T>;

  // Types of rules. Add types of your rules to RuleTypes in 'livr/types/inference'
  export type RuleTypes = _RuleTypes;
  export type BuiltInRuleTypes = _BuiltInRuleTypes;
  export type RuleType = _RuleType;
  export type Present<T> = _Present<T>;
  export type As<T> = _As<T>;
  export type AliasType<Rules> = _AliasType<Rules>;

  /** @deprecated Add the rule to RuleTypes, see the migration guide in TYPESCRIPT.md */
  export type RuleTypeDef<
    TOutput = unknown,
    TRequiredEffect extends boolean = false,
    TDefaultEffect extends boolean = false,
  > = _RuleTypeDef<TOutput, TRequiredEffect, TDefaultEffect>;
  /** @deprecated Use RuleTypes */
  export type RuleTypeRegistry = _RuleTypeRegistry;
  /** @deprecated Use RuleTypes with an interface that extends RuleType */
  export type ParameterizedRuleDef<
    TTemplate extends string = string,
    TRequiredEffect extends boolean = false,
    TDefaultEffect extends boolean = false,
  > = _ParameterizedRuleDef<TTemplate, TRequiredEffect, TDefaultEffect>;
  /** @deprecated Use RuleTypes with an interface that extends RuleType */
  export type ParameterizedRuleRegistry = _ParameterizedRuleRegistry;
  /** @deprecated `my_rule: string` or `my_rule: As<string>` in RuleTypes */
  export type SimpleRule<T> = _SimpleRule<T>;
  /** @deprecated An interface that extends RuleType with `present: true`, like `required` */
  export type RequiredRule = _RequiredRule;
  /** @deprecated Use RuleTypes with an interface that extends RuleType */
  export type ParameterizedRule<F> = _ParameterizedRule<F>;
  /** @deprecated `my_rule: Present<T>` in RuleTypes */
  export type DefaultRule<T> = _DefaultRule<T>;

  export const rules: Record<string, RuleFactory>;
}

export = LIVR;
