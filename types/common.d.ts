// types/common.d.ts
// Declarations shared by the validators of 'livr' (types/index.d.ts) and 'livr/async'
// (types/async.d.ts)

import type { LIVRSchema, LIVRRuleDefinition, RuleName, TypeOptions } from './inference';

/** Strict mode (`strictRules: true` in TypeOptions): only rules with a type, see TypeOptions */
type IsStrictRules = TypeOptions extends { readonly strictRules: true } ? true : false;

/** A schema of a validator. In strict mode only rules with a type */
export type ValidatorSchema = IsStrictRules extends true ? LIVRSchema : Record<string, any>;

/** Options of a validator, or `autoTrim` as a boolean */
export type ValidatorOptions = boolean | { autoTrim?: boolean };

/** An alias: a name for a list of rules, with its own error code */
export interface Alias {
  name: IsStrictRules extends true ? RuleName : string;
  rules: IsStrictRules extends true ? LIVRRuleDefinition : LIVRRuleDefinition | Record<string, any>;
  error?: string;
}

/**
 * A rule: gets the rule arguments and then the rules of the validator, returns the function
 * that validates a value. It returns an error code, or undefined when the value is valid
 */
export type RuleFactory = (
  ...args: Array<any>
) => (value: any, params: any, outputArr: Array<any>) => string | undefined;

/**
 * A rule of AsyncValidator: its function may also return a promise of the error code.
 * Meta rules return the errors of the nested values as error codes
 */
export type AsyncRuleFactory = (
  ...args: Array<any>
) => (value: any, params: any, outputArr: Array<any>) => unknown;

/** Rules by name, for registerRules() and registerDefaultRules(). In strict mode only rules with a type */
export type RuleFactories<Factory> = IsStrictRules extends true
  ? { readonly [Name in RuleName]?: Factory }
  : Record<string, Factory>;

/** Helpers of the rules, `LIVR.util` */
export interface Util {
  /** A string, a finite number or a boolean */
  isPrimitiveValue(value: unknown): boolean;
  /** A number or a string with a number: `+value` is not NaN */
  looksLikeNumber(value: unknown): boolean;
  /** A plain object: from `{}`, `Object.create(null)` or with an own `constructor` key */
  isObject(value: unknown): boolean;
  /** An object without enumerable keys */
  isEmptyObject(value: unknown): boolean;
  /** Escape the special characters of regular expressions */
  escapeRegExp(value: string): string;
  /** An empty value: undefined, null or '', rules skip them unless the field is required */
  isNoValue(value: unknown): value is undefined | null | '';
  /** An object with a `then` method */
  isThenable(value: unknown): value is PromiseLike<unknown>;
  /** The value of a field of the data. Inherited methods (`constructor`...) are not values */
  getFieldValue(data: object, fieldName: string): unknown;
  /** snake_case to camelCase, like the camelCase names of the rules */
  camelize(value: string): string;
}
