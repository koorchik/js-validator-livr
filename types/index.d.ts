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

// Re-export inference types
export type {
    InferFromSchema,
    InferRuleType,
    LIVRSchema,
    LIVRRuleDefinition,
    LIVRPrimitive,
    RuleTypeDef,
    RuleTypeRegistry,
    ParameterizedRuleDef,
    ParameterizedRuleRegistry,
    Simplify,
    SimpleRule,
    RequiredRule,
    ParameterizedRule,
    DefaultRule,
} from './inference';

type Schema = Record<string, any>;

interface Alias {
    name: string;
    rules: Schema;
    error?: string;
}

type RuleFactory = (
    ...args: Array<any>
) => (value: any, params: any, outputArr: Array<any>) => string | undefined;

declare module 'livr' {
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
         * Validates the provided data against the prepared rules.
         *
         * @param data The object (or primitive) to validate.
         * @returns The validated data if validation passes, or `false` if validation fails.
         */
        validate(data: T): T | false;

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

    /**
     * LIVR module exports as a CommonJS object with named exports.
     */
    const LIVR: {
        Validator: typeof Validator;
        ValidatorError: typeof ValidatorError;
        rules: Record<string, RuleFactory>;
    };

    export = LIVR;
}
