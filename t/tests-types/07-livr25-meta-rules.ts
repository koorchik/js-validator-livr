// t/tests-types/07-livr25-meta-rules.ts
// Types of the LIVR 2.5 meta rules: when, values, keys, any

import LIVR = require('../../lib/LIVR');
import type { InferFromSchema, InferRuleType, MakesPresent } from '../../types';
import type { Expect, Equal } from './utils';

/** Output type of a schema with one field */
type Field<Rules> = InferFromSchema<{ field: Rules }>;

// ============================================================================
// any: keeps the value, unknown or the type of earlier rules
// ============================================================================

type _any = [
  Expect<Equal<Field<'any'>, { field?: unknown }>>,
  Expect<Equal<Field<['required', 'any']>, { field: unknown }>>,
  Expect<Equal<Field<['integer', 'any']>, { field?: number }>>,
  Expect<Equal<Field<{ any: [] }>, { field?: unknown }>>,
];

// ============================================================================
// values: an object with the type of the value rules, arguments like list_of
// ============================================================================

type _values = [
  Expect<Equal<Field<{ values: 'integer' }>, { field?: Record<string, number> }>>,
  Expect<Equal<Field<{ values: ['required', 'integer'] }>, { field?: Record<string, number> }>>,
  Expect<Equal<Field<{ values: [['required', 'integer']] }>, { field?: Record<string, number> }>>,
  Expect<Equal<Field<{ values: { one_of: ['a', 'b'] } }>, { field?: Record<string, 'a' | 'b'> }>>,
  Expect<
    Equal<
      Field<{ values: { nested_object: { a: 'string' } } }>,
      { field?: Record<string, { a?: string }> }
    >
  >,
  Expect<Equal<Field<['required', { values: 'string' }]>, { field: Record<string, string> }>>,
  Expect<
    Equal<
      Field<{ values: { values: 'string' } }>,
      { field?: Record<string, Record<string, string>> }
    >
  >,
];

// ============================================================================
// keys: only checks the keys, the value is an object, an object type of earlier rules is kept
// ============================================================================

type _keys = [
  Expect<Equal<Field<{ keys: { one_of: ['uk', 'en'] } }>, { field?: Record<string, unknown> }>>,
  Expect<Equal<Field<{ keys: ['required', 'string'] }>, { field?: Record<string, unknown> }>>,
  Expect<Equal<Field<{ keys: [['required', 'string']] }>, { field?: Record<string, unknown> }>>,
  Expect<
    Equal<
      Field<[{ keys: { one_of: ['uk', 'en'] } }, { values: 'string' }]>,
      { field?: Record<string, string> }
    >
  >,
  Expect<
    Equal<
      Field<[{ values: 'string' }, { keys: { one_of: ['uk', 'en'] } }]>,
      { field?: Record<string, string> }
    >
  >,
  Expect<
    Equal<Field<['required', { keys: { max_length: 2 } }]>, { field: Record<string, unknown> }>
  >,
];

// ============================================================================
// when: a union of the branches, or of the cases in the switch form
// ============================================================================

type _when = [
  // Condition form: rules if true | rules if false
  Expect<
    Equal<
      Field<{ when: ['phone', 'not_empty', 'email', ['required', 'email']] }>,
      { field?: string }
    >
  >,
  Expect<
    Equal<
      Field<{ when: ['type', { eq: 'company' }, ['required', 'string'], ['required', 'integer']] }>,
      { field: string | number }
    >
  >,
  // Without rules if false the value is kept: the type of earlier rules
  Expect<
    Equal<Field<['integer', { when: ['flag', 'not_empty', 'required'] }]>, { field?: number }>
  >,
  Expect<
    Equal<
      Field<['integer', { when: ['flag', 'not_empty', { one_of: [1, 2] }] }]>,
      { field?: number }
    >
  >,
  // The field is present when both branches make it present
  Expect<
    Equal<Field<['string', { when: ['a', 'not_empty', 'required', 'trim'] }]>, { field?: string }>
  >,
  Expect<
    Equal<
      Field<['string', { when: ['a', 'not_empty', 'required', 'required'] }]>,
      { field: string }
    >
  >,
  // Switch form: a union of the cases. The field is not always present: without a case to choose
  // (an empty or unknown referenced value) an empty value stays as it is
  Expect<
    Equal<
      Field<
        [
          'required',
          {
            when: [
              'type',
              {
                card: { nested_object: { number: ['required', 'string'] } };
                bank: { nested_object: { iban: ['required', 'string'] } };
              },
            ];
          },
        ]
      >,
      { field: { number: string } | { iban: string } }
    >
  >,
  Expect<
    Equal<
      Field<{ when: ['kind', { a: ['required', 'integer']; b: ['required', 'string'] }] }>,
      { field?: number | string }
    >
  >,
  Expect<
    Equal<
      Field<['required', { when: ['kind', { a: 'integer'; b: ['required', 'string'] }] }]>,
      { field: number | string }
    >
  >,
  Expect<
    Equal<
      Field<{ when: ['kind', { a: ['required', 'integer']; b: 'string' }] }>,
      { field?: number | string }
    >
  >,
  // Nested when
  Expect<
    Equal<
      Field<{
        when: ['a', 'not_empty', { when: ['b', 'not_empty', 'integer', 'string'] }, 'email'];
      }>,
      { field?: number | string }
    >
  >,
];

// camelCase names are not needed for one-word rules, InferRuleType and MakesPresent work too
type _helpers = [
  Expect<Equal<InferRuleType<{ values: 'integer' }>, Record<string, number>>>,
  Expect<Equal<MakesPresent<{ when: ['a', 'not_empty', 'required'] }>, false>>,
  Expect<Equal<MakesPresent<{ when: ['a', { x: 'required'; y: 'required' }] }>, false>>,
  Expect<Equal<MakesPresent<{ when: ['a', 'not_empty', 'required', 'required'] }>, true>>,
];

// ============================================================================
// A schema with all of them, through the validator
// ============================================================================

const schema = {
  type: ['required', { one_of: ['card', 'bank'] }],
  data: [
    'required',
    {
      when: [
        'type',
        {
          card: { nested_object: { number: ['required', 'string'] } },
          bank: { nested_object: { iban: ['required', 'string'] } },
        },
      ],
    },
  ],
  vat_number: { when: ['type', { eq: 'company' }, ['required', 'string']] },
  stock: { values: ['required', 'positive_integer'] },
  translations: [{ keys: { one_of: ['uk', 'en', 'de'] } }, { values: ['required', 'string'] }],
  metadata: 'any',
} as const;

type Output = InferFromSchema<typeof schema>;

type _schema = Expect<
  Equal<
    Output,
    {
      type: 'card' | 'bank';
      data: { number: string } | { iban: string };
      vat_number?: unknown;
      stock?: Record<string, number>;
      translations?: Record<string, string>;
      metadata?: unknown;
    }
  >
>;

const validator = new LIVR.Validator<Output>(schema);
const output = validator.validate({});
if (output) output.data satisfies { number: string } | { iban: string };
