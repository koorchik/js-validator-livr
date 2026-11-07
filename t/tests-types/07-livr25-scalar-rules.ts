// t/tests-types/07-livr25-scalar-rules.ts
// Types of the LIVR 2.5 scalar, list, presence and parsing rules; no "now" option

import type { InferFromSchema } from '../../types';
import type { Expect, Equal } from './utils';
import LIVR = require('../../lib/LIVR');
import LIVRAsync = require('../../async');

/** Output type of a schema with one field */
type Field<Rules> = InferFromSchema<{ field: Rules }>;

// ============================================================================
// Types and numbers
// ============================================================================

// boolean: a real boolean, a literal of earlier rules is kept
type _boolean = [
  Expect<Equal<Field<'boolean'>, { field?: boolean }>>,
  Expect<Equal<Field<['required', 'boolean']>, { field: boolean }>>,
  Expect<Equal<Field<[{ eq: true }, 'boolean']>, { field?: true }>>,
];

// not_one_of: only checks a primitive value
type _notOneOf = [
  Expect<Equal<Field<{ not_one_of: ['admin', 'root'] }>, { field?: string | number | boolean }>>,
  Expect<Equal<Field<['string', { not_one_of: 'admin' }]>, { field?: string }>>,
  Expect<Equal<Field<[{ one_of: ['a', 'b'] }, { not_one_of: 'b' }]>, { field?: 'a' | 'b' }>>,
];

// max_decimals: numbers
type _numbers = [
  Expect<Equal<Field<{ max_decimals: 2 }>, { field?: number }>>,
  Expect<Equal<Field<['required', { max_decimals: 0 }]>, { field: number }>>,
];

// ============================================================================
// Strings, dates and times
// ============================================================================

type _strings = [
  Expect<Equal<Field<'digits'>, { field?: string }>>,
  Expect<Equal<Field<['digits', { length_equal: 6 }]>, { field?: string }>>,
  Expect<Equal<Field<{ starts_with: ['https://', 'http://'] }>, { field?: string }>>,
  Expect<Equal<Field<{ ends_with: '.pdf' }>, { field?: string }>>,
  Expect<Equal<Field<{ contains: '@' }>, { field?: string }>>,
  Expect<Equal<Field<'iso_time'>, { field?: string }>>,
  Expect<Equal<Field<{ iso_date: { max: 'today' } }>, { field?: string }>>,
  Expect<Equal<Field<{ iso_date: { min: '2026-06-01'; max: '2026-08-31' } }>, { field?: string }>>,
  Expect<Equal<Field<'iso_datetime'>, { field?: string }>>,
  Expect<Equal<Field<['required', 'iso_datetime']>, { field: string }>>,
  Expect<
    Equal<
      Field<{ iso_datetime: { min: '2026-01-01T09:00:00Z'; max: 'tomorrow' } }>,
      { field?: string }
    >
  >,
  Expect<Equal<Field<{ iso_time: { min: '22:00'; max: '06:00' } }>, { field?: string }>>,
];

// ============================================================================
// Presence
// ============================================================================

// required_if: the field may be missing, the type is kept
type _requiredIf = [
  Expect<Equal<Field<{ required_if: { send: true } }>, { field?: unknown }>>,
  Expect<Equal<Field<[{ required_if: { type: ['a', 'b'] } }, 'email']>, { field?: string }>>,
  Expect<Equal<Field<['positive_integer', { required_if: { a: 1 } }]>, { field?: number }>>,
];

// ============================================================================
// Lists, modifiers and parsing
// ============================================================================

// list_length and unique keep a list type of earlier rules
type _lists = [
  Expect<Equal<Field<{ list_length: [1, 10] }>, { field?: unknown[] }>>,
  Expect<Equal<Field<{ list_length: { max: 100 } }>, { field?: unknown[] }>>,
  Expect<Equal<Field<[{ list_of: 'integer' }, { list_length: 2 }]>, { field?: number[] }>>,
  Expect<Equal<Field<'unique'>, { field?: unknown[] }>>,
  Expect<Equal<Field<[{ list_of: 'string' }, { unique: [] }]>, { field?: string[] }>>,
  Expect<Equal<Field<[{ unique: ['country', 'zip'] }]>, { field?: unknown[] }>>,
];

// split: a list of strings (numbers and booleans in their string form), a list of earlier rules
// is kept, then list_of gives the item type
type _split = [
  Expect<Equal<Field<{ split: ',' }>, { field?: string[] }>>,
  Expect<Equal<Field<['string', { split: ',' }]>, { field?: string[] }>>,
  Expect<Equal<Field<['integer', { split: ',' }]>, { field?: string[] }>>,
  Expect<Equal<Field<['boolean', { split: 1 }]>, { field?: string[] }>>,
  Expect<Equal<Field<[{ split: ',' }, { list_of: 'positive_integer' }]>, { field?: number[] }>>,
  Expect<Equal<Field<[{ list_of: 'integer' }, { split: ',' }]>, { field?: number[] }>>,
];

// camelCase names
type _camelCase = [
  Expect<Equal<Field<{ notOneOf: ['a'] }>, { field?: string | number | boolean }>>,
  Expect<Equal<Field<{ maxDecimals: 2 }>, { field?: number }>>,
  Expect<Equal<Field<{ listLength: 2 }>, { field?: unknown[] }>>,
  Expect<Equal<Field<'isoTime'>, { field?: string }>>,
  Expect<Equal<Field<'isoDatetime'>, { field?: string }>>,
  Expect<Equal<Field<{ isoDatetime: { max: 'today' } }>, { field?: string }>>,
];

// ============================================================================
// No "now" option: rules read the system clock, tests fix it with fake timers
// ============================================================================

const dateSchema = { date: { iso_date: { max: 'today' } } } as const;

new LIVR.Validator(dateSchema, { autoTrim: true });
new LIVRAsync.AsyncValidator(dateSchema, true);

// @ts-expect-error there is no "now" option
new LIVR.Validator(dateSchema, { now: new Date('2026-10-29T12:00:00Z') });
// @ts-expect-error there is no "now" option
new LIVRAsync.AsyncValidator(dateSchema, { now: '2026-10-29T12:00:00Z' });
