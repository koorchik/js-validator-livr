// t/tests-types/strict-args/app.ts
// Arguments of the built-in rules in strict mode (`strictRules: true`), verified via
// `npx tsc --noEmit -p t/tests-types/strict-args`. A program of its own without rule packages:
// their types would replace the built-in types of uuid, iso_date, list_length...
//
// The types follow the validator: a LIVR 2.5 rule without arguments rejects any argument, a rule
// with arguments allows extra arguments after them (the validator ignores them), a number may be
// a numeric string and a string may be a number. The LIVR 2.0 rules without arguments take any
// arguments: the validator ignores them, as in LIVR 2.0. `{ rule: null }` is one null argument: an
// error for the LIVR 2.5 rules, the plain iso_date (LIVR 2.0 ignored its arguments), and the LIVR
// 2.0 rules and custom rules get null as their argument

import LIVR from 'livr';
import LIVRAsync from 'livr/async';
import type { InferFromSchema, LIVRSchema } from 'livr/types';
import type { As } from 'livr/types/inference';
import type { Expect, Equal } from '../utils';

/** A custom rule with the types of its arguments */
type PrefixParams = readonly [prefix: string, ...ignored: unknown[]];

declare module 'livr/types/inference' {
  interface TypeOptions {
    strictRules: true;
  }

  interface RuleTypes {
    has_prefix: As<string, PrefixParams>;
    // Without Params: any arguments, as before
    loose: As<string>;
  }
}

/** `true` when the arguments fit the rules */
type Valid<S> = S extends LIVRSchema ? true : false;
type Rule<R> = Valid<{ field: R }>;

// ============================================================================
// LIVR 2.0 rules
// ============================================================================

type _livr20 = [
  // Without arguments: any argument, the validator ignores them
  Expect<Rule<'required'>>,
  Expect<Rule<{ required: [] }>>,
  Expect<Rule<{ required: true }>>,
  Expect<Rule<{ email: [1, 'x'] }>>,
  Expect<Rule<{ trim: 'both' }>>,
  Expect<Rule<{ integer: {} }>>,
  Expect<Rule<{ to_lc: [] }>>,
  Expect<Rule<{ notEmpty: 1 }>>,
  // A number, also as a string, extra arguments are ignored
  Expect<Rule<{ min_length: 5 }>>,
  Expect<Rule<{ max_length: '10' }>>,
  Expect<Rule<{ length_equal: [5, 'ignored'] }>>,
  Expect<Rule<{ length_between: [1, '10'] }>>,
  Expect<Rule<{ number_between: [0, 1.5, 'ignored'] }>>,
  Expect<Rule<{ min_number: -1 }>>,
  Expect<Equal<Rule<{ min_length: 'five' }>, false>>,
  Expect<Equal<Rule<{ max_length: true }>, false>>,
  Expect<Equal<Rule<{ length_between: 5 }>, false>>,
  Expect<Equal<Rule<{ length_between: [1] }>, false>>,
  Expect<Equal<Rule<{ number_between: [1, null] }>, false>>,
  // Values: primitive values
  Expect<Rule<{ eq: 'a' }>>,
  Expect<Rule<{ eq: [true] }>>,
  Expect<Rule<{ one_of: ['a', 1, true] }>>,
  Expect<Rule<{ one_of: [['a', 'b']] }>>,
  Expect<Rule<{ one_of: [['a', 'b'], 'ignored'] }>>,
  Expect<Equal<Rule<{ eq: { a: 1 } }>, false>>,
  Expect<Equal<Rule<{ one_of: [{ a: 1 }] }>, false>>,
  // Strings
  Expect<Rule<{ like: '^[a-z]+$' }>>,
  Expect<Rule<{ like: ['^[a-z]+$', 'i'] }>>,
  Expect<Rule<{ like: ['^[a-z]+$', 'i', 'ignored'] }>>,
  Expect<Rule<{ equal_to_field: 'password' }>>,
  Expect<Rule<{ remove: ' -' }>>,
  Expect<Rule<{ leave_only: ['0123456789', 'ignored'] }>>,
  Expect<Equal<Rule<{ like: ['^a$', 1] }>, false>>,
  Expect<Equal<Rule<{ remove: 1 }>, false>>,
  Expect<Equal<Rule<{ equal_to_field: true }>, false>>,
  // default takes any value
  Expect<Rule<{ default: 0 }>>,
  Expect<Rule<{ default: [[1, 2]] }>>,
  Expect<Rule<{ default: { a: 1 } }>>,
  Expect<Rule<{ default: null }>>,
  Expect<Rule<{ required: null }>>,
  // iso_date: nothing or an options object first
  Expect<Rule<'iso_date'>>,
  Expect<Rule<{ iso_date: [] }>>,
  Expect<Rule<{ iso_date: {} }>>,
  Expect<Rule<{ iso_date: [{}] }>>,
  Expect<Rule<{ iso_date: { min: 'today'; max: '2030-01-01' } }>>,
  Expect<Rule<{ iso_date: [{ max: 'today' }, 'ignored'] }>>,
  Expect<Rule<{ iso_date: null }>>,
  Expect<Equal<Rule<{ iso_date: [null, { max: 'today' }] }>, false>>,
  Expect<Equal<Rule<{ iso_date: 'today' }>, false>>,
  Expect<Equal<Rule<{ iso_date: true }>, false>>,
  Expect<Equal<Rule<{ iso_date: 5 }>, false>>,
  Expect<Equal<Rule<{ iso_date: ['x', { min: 'today' }] }>, false>>,
  Expect<Equal<Rule<{ iso_date: { min: 1 } }>, false>>,
  // Meta rules: extra arguments after the schema or the rules are ignored
  Expect<Rule<{ nested_object: [{ a: 'string' }, 'ignored'] }>>,
  Expect<Rule<{ list_of_objects: [{ a: 'string' }, 'ignored'] }>>,
  Expect<Rule<{ variable_object: ['type', { a: { b: 'string' } }, 'ignored'] }>>,
  Expect<Rule<{ list_of: [['required', 'string'], 'ignored'] }>>,
  Expect<Equal<Rule<{ nested_object: [{ a: 'strng' }, 'ignored'] }>, false>>,
];

// ============================================================================
// LIVR 2.5 rules without arguments: any argument is an error
// ============================================================================

type _noArguments = [
  Expect<Rule<'boolean'>>,
  Expect<Rule<{ boolean: [] }>>,
  Expect<Rule<['required', 'jwt', { hostname: [] }]>>,
  // null is an argument
  Expect<Equal<Rule<{ boolean: null }>, false>>,
  Expect<Equal<Rule<['required', { jwt: null }]>, false>>,
  Expect<Equal<Rule<{ credit_card: null }>, false>>,
  Expect<Equal<Rule<{ any: null }>, false>>,
  Expect<Equal<Rule<{ boolean: [null, 1] }>, false>>,
  Expect<Equal<Rule<{ boolean: 1 }>, false>>,
  Expect<Equal<Rule<{ boolean: [true] }>, false>>,
  Expect<Equal<Rule<{ jwt: 'HS256' }>, false>>,
  Expect<Equal<Rule<{ iban: 'UA' }>, false>>,
  Expect<Equal<Rule<{ digits: [6] }>, false>>,
  Expect<Equal<Rule<{ hostname: {} }>, false>>,
  Expect<Equal<Rule<{ hex: 1 }>, false>>,
  Expect<Equal<Rule<{ mongo_id: 'x' }>, false>>,
  Expect<Equal<Rule<{ hex_color: 'x' }>, false>>,
  Expect<Equal<Rule<{ e164: 'x' }>, false>>,
  Expect<Equal<Rule<{ semver: 2 }>, false>>,
  Expect<Equal<Rule<{ luhn: 1 }>, false>>,
  Expect<Equal<Rule<{ credit_card: 'visa' }>, false>>,
  Expect<Equal<Rule<{ creditCard: 'visa' }>, false>>,
  Expect<Equal<Rule<{ any: 1 }>, false>>,
];

// ============================================================================
// LIVR 2.5 rules with arguments
// ============================================================================

type _arguments = [
  // A number, also as a string; extra arguments are ignored
  Expect<Rule<{ max_decimals: 2 }>>,
  Expect<Rule<{ max_decimals: '2' }>>,
  Expect<Rule<{ max_decimals: [2, 3] }>>,
  Expect<Rule<{ maxDecimals: [2] }>>,
  Expect<Equal<Rule<{ max_decimals: true }>, false>>,
  Expect<Equal<Rule<{ max_decimals: 'two' }>, false>>,
  Expect<Equal<Rule<{ max_decimals: [] }>, false>>,
  Expect<Rule<{ list_length: 2 }>>,
  Expect<Rule<{ list_length: '2' }>>,
  Expect<Rule<{ list_length: [1, 10] }>>,
  Expect<Rule<{ list_length: [1, '10', 'ignored'] }>>,
  Expect<Rule<{ list_length: { min: 1 } }>>,
  Expect<Rule<{ list_length: [{ max: '10' }, 'ignored'] }>>,
  Expect<Equal<Rule<{ list_length: [1, 'x'] }>, false>>,
  Expect<Equal<Rule<{ list_length: { min: true } }>, false>>,
  Expect<Equal<Rule<{ list_length: [] }>, false>>,
  Expect<Rule<{ mac: 64 }>>,
  Expect<Rule<{ mac: '64' }>>,
  Expect<Rule<{ mac: [48, 64] }>>,
  Expect<Rule<'mac'>>,
  Expect<Equal<Rule<{ mac: 32 }>, false>>,
  // A string, also as a number; extra arguments are ignored
  Expect<Rule<{ split: ',' }>>,
  Expect<Rule<{ split: 1 }>>,
  Expect<Rule<{ split: [',', ';'] }>>,
  Expect<Equal<Rule<{ split: true }>, false>>,
  Expect<Equal<Rule<{ split: [] }>, false>>,
  Expect<Rule<{ ip: 'v4' }>>,
  Expect<Rule<{ ip: ['v4', 'v6'] }>>,
  Expect<Rule<{ cidr: [] }>>,
  Expect<Rule<{ base64: 'url' }>>,
  Expect<Equal<Rule<{ ip: 4 }>, false>>,
  Expect<Equal<Rule<{ cidr: 'v5' }>, false>>,
  Expect<Equal<Rule<{ base64: 'relaxed' }>, false>>,
  // null is a wrong argument, also for a rule that can take none
  Expect<Equal<Rule<{ ip: null }>, false>>,
  Expect<Equal<Rule<{ cidr: null }>, false>>,
  Expect<Equal<Rule<{ base64: null }>, false>>,
  Expect<Equal<Rule<{ mac: null }>, false>>,
  Expect<Equal<Rule<{ uuid: null }>, false>>,
  Expect<Equal<Rule<{ unique: null }>, false>>,
  Expect<Equal<Rule<{ iso_datetime: null }>, false>>,
  Expect<Equal<Rule<{ iso_time: null }>, false>>,
  Expect<Equal<Rule<{ ip: [null, 'v4'] }>, false>>,
  Expect<Equal<Rule<{ unique: [null, 'id'] }>, false>>,
  Expect<Equal<Rule<{ split: null }>, false>>,
  Expect<Equal<Rule<{ max_decimals: null }>, false>>,
  Expect<Equal<Rule<{ list_length: null }>, false>>,
  Expect<Equal<Rule<{ list_length: { min: null } }>, false>>,
  Expect<Equal<Rule<{ starts_with: null }>, false>>,
  // Variadic rules take all arguments
  Expect<Rule<{ starts_with: ['https://', 'http://'] }>>,
  Expect<Rule<{ ends_with: 1 }>>,
  Expect<Rule<{ contains: '@' }>>,
  Expect<Rule<{ not_one_of: ['admin', 1, true] }>>,
  Expect<Rule<{ not_one_of: 'root' }>>,
  Expect<Rule<{ uuid: 'v4' }>>,
  Expect<Rule<{ uuid: ['v4', 'v7'] }>>,
  Expect<Rule<{ uuid: [] }>>,
  Expect<Rule<{ digest: ['md5', 'sha256'] }>>,
  Expect<Rule<{ unique: ['country', 'zip'] }>>,
  Expect<Rule<{ unique: 0 }>>,
  Expect<Rule<'unique'>>,
  Expect<Equal<Rule<{ starts_with: [] }>, false>>,
  Expect<Equal<Rule<{ starts_with: ['a', true] }>, false>>,
  Expect<Equal<Rule<{ not_one_of: [] }>, false>>,
  Expect<Equal<Rule<{ not_one_of: [null] }>, false>>,
  Expect<Equal<Rule<{ uuid: 4 }>, false>>,
  Expect<Equal<Rule<{ uuid: ['v4', 'v9'] }>, false>>,
  Expect<Equal<Rule<{ digest: [] }>, false>>,
  Expect<Equal<Rule<{ digest: 'MD5' }>, false>>,
  Expect<Equal<Rule<{ unique: true }>, false>>,
  // Options objects first; extra arguments are ignored
  Expect<Rule<{ iso_datetime: { min: '2026-01-01T09:00Z'; max: 'tomorrow' } }>>,
  Expect<Rule<{ iso_datetime: [{}, 'ignored'] }>>,
  Expect<Rule<{ iso_time: { min: '22:00'; max: '06:00' } }>>,
  Expect<Equal<Rule<{ iso_datetime: 'today' }>, false>>,
  Expect<Equal<Rule<{ iso_time: '09:00' }>, false>>,
  Expect<Rule<{ required_if: { type: 'company' } }>>,
  Expect<Rule<{ required_if: { type: ['company', 'ngo']; 'address/country': 1 } }>>,
  Expect<Rule<{ required_if: [{ subscribe: true }, 'ignored'] }>>,
  Expect<Equal<Rule<{ required_if: 'type' }>, false>>,
  Expect<Equal<Rule<{ required_if: { type: [] } }>, false>>,
  Expect<Equal<Rule<{ required_if: { type: null } }>, false>>,
];

// ============================================================================
// LIVR 2.5 meta rules: no empty lists of rules
// ============================================================================

type _metaRules = [
  Expect<Rule<{ when: ['type', { eq: 'company' }, 'required'] }>>,
  Expect<Rule<{ when: ['type', 'required', 'required', { eq: '' }] }>>,
  Expect<Rule<{ when: ['type', 'required', 'required', 'any', 'ignored'] }>>,
  Expect<Rule<{ when: ['type', { a: 'any'; b: ['required', 'string'] }] }>>,
  Expect<Equal<Rule<{ when: ['type'] }>, false>>,
  Expect<Equal<Rule<{ when: [1, 'required', 'string'] }>, false>>,
  Expect<Equal<Rule<{ when: ['type', [], 'required'] }>, false>>,
  Expect<Equal<Rule<{ when: ['type', 'required', []] }>, false>>,
  Expect<Equal<Rule<{ when: ['type', 'required', 'string', []] }>, false>>,
  Expect<Equal<Rule<{ when: ['type', { a: [] }] }>, false>>,
  Expect<Equal<Rule<{ when: ['type', 'required', 'strng'] }>, false>>,
  Expect<Rule<{ values: 'string' }>>,
  Expect<Rule<{ values: ['required', 'string'] }>>,
  Expect<Rule<{ values: [['required', 'string']] }>>,
  Expect<Rule<{ keys: { one_of: ['uk', 'en'] } }>>,
  Expect<Equal<Rule<{ values: [] }>, false>>,
  Expect<Equal<Rule<{ values: [[]] }>, false>>,
  Expect<Equal<Rule<{ keys: [[]] }>, false>>,
  Expect<Equal<Rule<{ keys: 'strng' }>, false>>,
];

// ============================================================================
// Custom rules with Params, in the validator API
// ============================================================================

type _custom = [
  Expect<Rule<{ has_prefix: 'SKU-' }>>,
  Expect<Rule<{ has_prefix: ['SKU-', 'ignored'] }>>,
  Expect<Equal<Rule<{ has_prefix: 1 }>, false>>,
  // A custom rule gets null as its argument, so its Params decide
  Expect<Equal<Rule<{ has_prefix: null }>, false>>,
  Expect<Rule<{ loose: [1, {}, null] }>>,
];

const schema = {
  name: ['required', 'string', { max_length: '20' }],
  amount: ['required', { max_decimals: '2' }],
  tags: [{ split: ',' }, { list_length: [1, 10] }, { list_of: 'string' }],
  mac: { mac: '64' },
  birth: { iso_date: { max: 'today' } },
  vat: { when: ['type', { eq: 'company' }, ['required', 'string'], { eq: '' }] },
  sku: { has_prefix: 'SKU-' },
  flag: 'boolean',
  day: ['required', { iso_date: null }],
} as const;

const validator = new LIVR.Validator<InferFromSchema<typeof schema>>(schema);
new LIVRAsync.AsyncValidator(schema);

type _output = Expect<
  Equal<
    InferFromSchema<typeof schema>,
    {
      name: string;
      amount: number;
      tags?: string[];
      mac?: string;
      birth?: string;
      vat?: string;
      sku?: string;
      flag?: boolean;
      day: string;
    }
  >
>;

// @ts-expect-error A LIVR 2.5 rule without arguments gets one
new LIVR.Validator({ flag: { boolean: 1 } });
// @ts-expect-error iso_date takes an options object first
new LIVR.Validator({ date: { iso_date: 'today' } });
// @ts-expect-error A number is a number or a numeric string
new LIVR.Validator({ amount: { max_decimals: 'two' } });
// @ts-expect-error An empty list of rules in when
new LIVRAsync.AsyncValidator({ vat: { when: ['type', 'required', []] } });
// @ts-expect-error With satisfies
const wrongSatisfies = { a: { jwt: 'HS256' } } as const satisfies LIVRSchema;
// A LIVR 2.0 rule without arguments ignores them
new LIVR.Validator({ name: { required: true } });

export { validator, wrongSatisfies };
