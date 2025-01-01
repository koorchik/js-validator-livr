// types/index.d.ts

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
