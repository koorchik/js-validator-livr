// t/tests-types/01-builtin-rules.ts
// Types of all built-in rules - verified at compile time via `npx tsc --noEmit`

import type { InferFromSchema, InferRuleType, MakesPresent } from '../../types';
import type { Expect, Equal } from './utils';

/** Output type of a schema with one field */
type Field<Rules> = InferFromSchema<{ field: Rules }>;

// ============================================================================
// Common rules
// ============================================================================

// required: the field is present, the type is kept
type _required = [
  Expect<Equal<Field<'required'>, { field: unknown }>>,
  Expect<Equal<Field<['required', 'string']>, { field: string }>>,
  Expect<Equal<Field<['string', 'required']>, { field: string }>>,
  Expect<Equal<Field<[{ one_of: ['a', 'b'] }, 'required']>, { field: 'a' | 'b' }>>,
];

// not_empty: only checks the value, a string as the first rule
type _notEmpty = [
  Expect<Equal<Field<'not_empty'>, { field?: string }>>,
  Expect<Equal<Field<['required', 'not_empty']>, { field: string }>>,
  Expect<Equal<Field<['integer', 'not_empty']>, { field?: number }>>,
  Expect<Equal<Field<[{ one_of: ['a', 'b'] }, 'not_empty']>, { field?: 'a' | 'b' }>>,
];

// not_empty_list: a missing list is an error, so the field is present
type _notEmptyList = [
  Expect<Equal<Field<'not_empty_list'>, { field: unknown[] }>>,
  Expect<Equal<Field<['not_empty_list', { list_of: 'integer' }]>, { field: number[] }>>,
  Expect<Equal<Field<[{ list_of: 'integer' }, 'not_empty_list']>, { field: number[] }>>,
];

// any_object: only checks the value, keeps an object type of earlier rules
type _anyObject = [
  Expect<Equal<Field<'any_object'>, { field?: Record<string, unknown> }>>,
  Expect<
    Equal<Field<[{ nested_object: { a: 'string' } }, 'any_object']>, { field?: { a?: string } }>
  >,
];

// ============================================================================
// String rules
// ============================================================================

// string: numbers become strings, literal types of earlier rules are kept
type _string = [
  Expect<Equal<Field<'string'>, { field?: string }>>,
  Expect<Equal<Field<['integer', 'string']>, { field?: string }>>,
  Expect<Equal<Field<[{ one_of: ['a', 'b'] }, 'string']>, { field?: 'a' | 'b' }>>,
];

// eq: the allowed value itself
type _eq = [
  Expect<Equal<Field<{ eq: 'a' }>, { field?: 'a' }>>,
  Expect<Equal<Field<{ eq: 5 }>, { field?: 5 }>>,
  Expect<Equal<Field<{ eq: true }>, { field?: true }>>,
  Expect<Equal<Field<['required', { eq: 'a' }]>, { field: 'a' }>>,
  Expect<Equal<Field<{ eq: string }>, { field?: string }>>,
];

// one_of: one of the allowed values, as an array or in an array
type _oneOf = [
  Expect<Equal<Field<{ one_of: ['a', 'b'] }>, { field?: 'a' | 'b' }>>,
  Expect<Equal<Field<{ one_of: [['a', 'b']] }>, { field?: 'a' | 'b' }>>,
  Expect<Equal<Field<{ one_of: readonly ['a', 'b'] }>, { field?: 'a' | 'b' }>>,
  Expect<Equal<Field<{ one_of: [1, 2] }>, { field?: 1 | 2 }>>,
  Expect<Equal<Field<{ one_of: string[] }>, { field?: string }>>,
  Expect<Equal<Field<['integer', { one_of: [1, 2] }]>, { field?: 1 | 2 }>>,
];

// Length rules and like: strings, literal types of earlier rules are kept
type _stringChecks = [
  Expect<Equal<Field<{ max_length: 10 }>, { field?: string }>>,
  Expect<Equal<Field<{ min_length: 1 }>, { field?: string }>>,
  Expect<Equal<Field<{ length_equal: 2 }>, { field?: string }>>,
  Expect<Equal<Field<{ length_between: [1, 10] }>, { field?: string }>>,
  Expect<Equal<Field<{ like: '^a' }>, { field?: string }>>,
  Expect<Equal<Field<{ like: ['^a', 'i'] }>, { field?: string }>>,
  Expect<Equal<Field<[{ one_of: ['x', 'yy'] }, { max_length: 2 }]>, { field?: 'x' | 'yy' }>>,
  Expect<Equal<Field<[{ one_of: ['x', 'yy'] }, { min_length: 1 }]>, { field?: 'x' | 'yy' }>>,
  Expect<Equal<Field<[{ one_of: ['x', 'y'] }, { length_equal: 1 }]>, { field?: 'x' | 'y' }>>,
  Expect<
    Equal<Field<[{ one_of: ['x', 'yy'] }, { length_between: [1, 2] }]>, { field?: 'x' | 'yy' }>
  >,
  Expect<Equal<Field<[{ one_of: ['x', 'y'] }, { like: '^[xy]$' }]>, { field?: 'x' | 'y' }>>,
  // Numbers become strings
  Expect<Equal<Field<['integer', { max_length: 3 }]>, { field?: string }>>,
  Expect<Equal<Field<[{ one_of: [1, 2] }, { like: '^1' }]>, { field?: string }>>,
];

// ============================================================================
// Numeric rules
// ============================================================================

// Numbers, number literal types of earlier rules are kept, strings become numbers
type _numeric = [
  Expect<Equal<Field<'integer'>, { field?: number }>>,
  Expect<Equal<Field<'positive_integer'>, { field?: number }>>,
  Expect<Equal<Field<'decimal'>, { field?: number }>>,
  Expect<Equal<Field<'positive_decimal'>, { field?: number }>>,
  Expect<Equal<Field<{ max_number: 10 }>, { field?: number }>>,
  Expect<Equal<Field<{ min_number: 1 }>, { field?: number }>>,
  Expect<Equal<Field<{ number_between: [1, 10] }>, { field?: number }>>,
  Expect<Equal<Field<[{ one_of: [1, 2] }, 'integer']>, { field?: 1 | 2 }>>,
  Expect<Equal<Field<[{ one_of: [1, 2] }, 'positive_integer']>, { field?: 1 | 2 }>>,
  Expect<Equal<Field<[{ one_of: [1.5, 2] }, 'decimal']>, { field?: 1.5 | 2 }>>,
  Expect<Equal<Field<[{ one_of: [1.5, 2] }, 'positive_decimal']>, { field?: 1.5 | 2 }>>,
  Expect<Equal<Field<[{ one_of: [1, 2] }, { max_number: 2 }]>, { field?: 1 | 2 }>>,
  Expect<Equal<Field<[{ one_of: [1, 2] }, { min_number: 1 }]>, { field?: 1 | 2 }>>,
  Expect<Equal<Field<[{ one_of: [1, 2] }, { number_between: [1, 2] }]>, { field?: 1 | 2 }>>,
  Expect<Equal<Field<['string', 'integer']>, { field?: number }>>,
  Expect<Equal<Field<[{ one_of: ['1', '2'] }, 'integer']>, { field?: number }>>,
  Expect<Equal<Field<['required', 'positive_integer', { max_number: 100 }]>, { field: number }>>,
];

// ============================================================================
// Special rules
// ============================================================================

type _special = [
  Expect<Equal<Field<'email'>, { field?: string }>>,
  Expect<Equal<Field<'url'>, { field?: string }>>,
  Expect<Equal<Field<'iso_date'>, { field?: string }>>,
  Expect<Equal<Field<[{ one_of: ['2024-01-01'] }, 'iso_date']>, { field?: '2024-01-01' }>>,
  // equal_to_field only checks the value: a string as the first rule, otherwise the type is kept
  Expect<Equal<Field<{ equal_to_field: 'password' }>, { field?: string }>>,
  Expect<Equal<Field<['required', { equal_to_field: 'password' }]>, { field: string }>>,
  Expect<Equal<Field<['integer', { equal_to_field: 'count' }]>, { field?: number }>>,
];

// ============================================================================
// Modifiers
// ============================================================================

type _modifiers = [
  Expect<Equal<Field<'trim'>, { field?: string }>>,
  Expect<Equal<Field<{ remove: '-' }>, { field?: string }>>,
  Expect<Equal<Field<{ leave_only: '0123456789' }>, { field?: string }>>,
  // A new string: literal types of earlier rules are not kept
  Expect<Equal<Field<[{ one_of: [' a', 'b '] }, 'trim']>, { field?: string }>>,
  Expect<Equal<Field<['integer', 'trim']>, { field?: string }>>,
  // Literal types in lower and upper case, otherwise a string
  Expect<Equal<Field<'to_lc'>, { field?: string }>>,
  Expect<Equal<Field<'to_uc'>, { field?: string }>>,
  Expect<Equal<Field<['string', 'to_lc']>, { field?: string }>>,
  Expect<Equal<Field<['string', 'to_uc']>, { field?: string }>>,
  Expect<Equal<Field<[{ one_of: ['Admin', 'USER'] }, 'to_lc']>, { field?: 'admin' | 'user' }>>,
  Expect<Equal<Field<[{ one_of: ['Admin', 'user'] }, 'to_uc']>, { field?: 'ADMIN' | 'USER' }>>,
  Expect<Equal<Field<['integer', 'to_lc']>, { field?: string }>>,
];

// default: the field is present. See 02-defaults-and-literals.ts for the first rule
type _default = [
  Expect<Equal<Field<['string', { default: 'x' }]>, { field: string }>>,
  Expect<Equal<Field<[{ one_of: ['a', 'b'] }, { default: 'a' }]>, { field: 'a' | 'b' }>>,
  Expect<Equal<Field<[{ one_of: ['a', 'b'] }, { default: 'c' }]>, { field: 'a' | 'b' | 'c' }>>,
  Expect<Equal<Field<[{ default: 'a' }, { one_of: ['a', 'b'] }]>, { field: 'a' | 'b' }>>,
  Expect<Equal<Field<[{ default: 1 }, 'positive_integer']>, { field: number }>>,
  // The rule gets the first argument: an array default is written in an array
  Expect<Equal<Field<{ default: [['a', 'b']] }>, { field: ['a', 'b'] }>>,
];

// ============================================================================
// Meta rules
// ============================================================================

type _nestedObject = [
  Expect<
    Equal<
      Field<{ nested_object: { a: ['required', 'string']; b: 'integer' } }>,
      { field?: { a: string; b?: number } }
    >
  >,
  Expect<
    Equal<
      Field<['required', { nested_object: { a: { nested_object: { b: 'required' } } } }]>,
      { field: { a?: { b: unknown } } }
    >
  >,
];

type _listOf = [
  Expect<Equal<Field<{ list_of: 'integer' }>, { field?: number[] }>>,
  Expect<Equal<Field<{ list_of: ['required', 'integer'] }>, { field?: number[] }>>,
  Expect<Equal<Field<{ list_of: [['required', 'integer']] }>, { field?: number[] }>>,
  Expect<Equal<Field<{ list_of: [{ one_of: ['a', 'b'] }] }>, { field?: Array<'a' | 'b'> }>>,
  Expect<
    Equal<
      Field<{ list_of: [{ one_of: ['a', 'b'] }, { max_length: 1 }] }>,
      { field?: Array<'a' | 'b'> }
    >
  >,
  Expect<
    Equal<Field<{ list_of: { nested_object: { a: 'string' } } }>, { field?: { a?: string }[] }>
  >,
  Expect<Equal<Field<{ list_of: { list_of: 'integer' } }>, { field?: number[][] }>>,
  Expect<Equal<Field<['required', { list_of: 'string' }]>, { field: string[] }>>,
];

type _listOfObjects = [
  Expect<
    Equal<
      Field<{ list_of_objects: { id: ['required', 'positive_integer']; name: 'string' } }>,
      { field?: { id: number; name?: string }[] }
    >
  >,
];

// variable_object: the selector field is in the output when the schema of its value has it
type VariantSchemas = {
  click: { type: { eq: 'click' }; x: ['required', 'integer'] };
  scroll: { type: 'required'; up: 'integer' };
  key: { code: ['required', 'string'] };
};

type _variableObject = [
  Expect<
    Equal<
      Field<{ variable_object: ['type', VariantSchemas] }>,
      {
        field?: { type: 'click'; x: number } | { type: 'scroll'; up?: number } | { code: string };
      }
    >
  >,
  Expect<
    Equal<
      Field<['required', { variable_object: ['type', { a: { type: 'required' } }] }]>,
      { field: { type: 'a' } }
    >
  >,
];

type _listOfDifferentObjects = [
  Expect<
    Equal<
      Field<{ list_of_different_objects: ['type', VariantSchemas] }>,
      {
        field?: Array<
          { type: 'click'; x: number } | { type: 'scroll'; up?: number } | { code: string }
        >;
      }
    >
  >,
];

// or: a union of the rule sets, applied to the value like aliases
type _or = [
  Expect<Equal<Field<{ or: ['string', 'integer'] }>, { field?: string | number }>>,
  Expect<Equal<Field<{ or: [['required', 'string'], 'integer'] }>, { field?: string | number }>>,
  // The field is present when every rule set makes it present
  Expect<
    Equal<
      Field<{ or: [['required', 'string'], ['required', 'integer']] }>,
      { field: string | number }
    >
  >,
  Expect<Equal<Field<['required', { or: ['string', 'integer'] }]>, { field: string | number }>>,
  Expect<
    Equal<
      Field<{ or: [{ nested_object: { a: 'string' } }, { list_of: 'integer' }] }>,
      { field?: { a?: string } | number[] }
    >
  >,
  // Rule sets get the type of the value
  Expect<
    Equal<
      Field<[{ one_of: ['a', 'b'] }, { or: [{ max_length: 1 }, 'integer'] }]>,
      { field?: 'a' | 'b' | number }
    >
  >,
  Expect<
    Equal<
      Field<[{ one_of: ['a', 'b'] }, { or: ['required', 'trim'] }]>,
      { field?: 'a' | 'b' | string }
    >
  >,
  // No rule sets: the value is not changed
  Expect<Equal<Field<['integer', { or: [] }]>, { field?: number }>>,
];

// ============================================================================
// camelCase names: the same types as snake_case names
// ============================================================================

type _camelCase = [
  Expect<Equal<Field<'notEmpty'>, Field<'not_empty'>>>,
  Expect<Equal<Field<'notEmptyList'>, Field<'not_empty_list'>>>,
  Expect<Equal<Field<'anyObject'>, Field<'any_object'>>>,
  Expect<Equal<Field<{ oneOf: ['a', 'b'] }>, Field<{ one_of: ['a', 'b'] }>>>,
  Expect<Equal<Field<[{ oneOf: ['x'] }, { maxLength: 2 }]>, { field?: 'x' }>>,
  Expect<Equal<Field<{ minLength: 1 }>, Field<{ min_length: 1 }>>>,
  Expect<Equal<Field<{ lengthEqual: 1 }>, Field<{ length_equal: 1 }>>>,
  Expect<Equal<Field<{ lengthBetween: [1, 2] }>, Field<{ length_between: [1, 2] }>>>,
  Expect<Equal<Field<'positiveInteger'>, Field<'positive_integer'>>>,
  Expect<Equal<Field<'positiveDecimal'>, Field<'positive_decimal'>>>,
  Expect<Equal<Field<{ maxNumber: 1 }>, Field<{ max_number: 1 }>>>,
  Expect<Equal<Field<{ minNumber: 1 }>, Field<{ min_number: 1 }>>>,
  Expect<Equal<Field<{ numberBetween: [1, 2] }>, Field<{ number_between: [1, 2] }>>>,
  Expect<Equal<Field<'isoDate'>, Field<'iso_date'>>>,
  Expect<Equal<Field<{ equalToField: 'a' }>, Field<{ equal_to_field: 'a' }>>>,
  Expect<Equal<Field<[{ oneOf: ['A'] }, 'toLc']>, { field?: 'a' }>>,
  Expect<Equal<Field<[{ oneOf: ['a'] }, 'toUc']>, { field?: 'A' }>>,
  Expect<Equal<Field<{ leaveOnly: '0' }>, Field<{ leave_only: '0' }>>>,
  Expect<
    Equal<Field<{ nestedObject: { a: 'integer' } }>, Field<{ nested_object: { a: 'integer' } }>>
  >,
  Expect<Equal<Field<{ listOf: 'integer' }>, Field<{ list_of: 'integer' }>>>,
  Expect<
    Equal<Field<{ listOfObjects: { a: 'integer' } }>, Field<{ list_of_objects: { a: 'integer' } }>>
  >,
  Expect<
    Equal<
      Field<{ variableObject: ['type', VariantSchemas] }>,
      Field<{ variable_object: ['type', VariantSchemas] }>
    >
  >,
  Expect<
    Equal<
      Field<{ listOfDifferentObjects: ['type', VariantSchemas] }>,
      Field<{ list_of_different_objects: ['type', VariantSchemas] }>
    >
  >,
];

// ============================================================================
// Rules without a type, InferRuleType and MakesPresent
// ============================================================================

type _withoutType = [
  Expect<Equal<Field<'no_such_rule'>, { field?: unknown }>>,
  Expect<Equal<Field<['string', 'no_such_rule']>, { field?: unknown }>>,
  Expect<Equal<Field<['required', 'no_such_rule']>, { field: unknown }>>,
];

type _inferRuleType = [
  Expect<Equal<InferRuleType<'integer'>, number>>,
  Expect<Equal<InferRuleType<['required', 'string']>, string>>,
  Expect<Equal<InferRuleType<{ list_of: 'string' }>, string[]>>,
];

// The type before the rules
type _inferRuleTypeWithInput = [
  Expect<Equal<InferRuleType<{ max_length: 1 }, 'a' | 'b'>, 'a' | 'b'>>,
  Expect<Equal<InferRuleType<'trim', 'a' | 'b'>, string>>,
  Expect<Equal<InferRuleType<[], number>, number>>,
];

type _makesPresent = [
  Expect<Equal<MakesPresent<'string'>, false>>,
  Expect<Equal<MakesPresent<['required', 'string']>, true>>,
  Expect<Equal<MakesPresent<['string', 'required']>, true>>,
  Expect<Equal<MakesPresent<[{ default: 1 }]>, true>>,
  Expect<Equal<MakesPresent<{ or: [['required', 'string'], 'integer'] }>, false>>,
  Expect<Equal<MakesPresent<[]>, false>>,
];

// ============================================================================
// A schema written with `as const`
// ============================================================================

const userSchema = {
  name: ['required', 'string', { max_length: 50 }],
  email: ['required', 'email', 'to_lc'],
  age: 'positive_integer',
  role: ['required', { one_of: ['admin', 'user'] }],
  status: { default: 'active' as 'active' | 'blocked' },
  tags: ['not_empty_list', { list_of: ['required', 'string'] }],
  address: {
    nested_object: {
      city: ['required', 'string'],
      zip: 'positive_integer',
    },
  },
  contact: {
    or: [{ nested_object: { email: ['required', 'email'] } }, ['required', 'string']],
  },
} as const;

type _userSchema = Expect<
  Equal<
    InferFromSchema<typeof userSchema>,
    {
      name: string;
      email: string;
      age?: number;
      role: 'admin' | 'user';
      status: 'active' | 'blocked';
      tags: string[];
      address?: { city: string; zip?: number };
      contact?: { email: string } | string;
    }
  >
>;

// Without `as const`, literal types are widened, rules still work
const looseSchema = {
  name: ['required', 'string'],
  role: { one_of: ['admin', 'user'] },
};

type _looseSchema = Expect<
  Equal<InferFromSchema<typeof looseSchema>, { name?: unknown; role?: string }>
>;
