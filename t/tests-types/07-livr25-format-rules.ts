// t/tests-types/07-livr25-format-rules.ts
// Types of the LIVR 2.5 format and checksum rules: they check the string form and output it

import type { InferFromSchema, RuleName } from '../../types';
import type { Expect, Equal } from './utils';

/** Output type of a schema with one field */
type Field<Rules> = InferFromSchema<{ field: Rules }>;

// ============================================================================
// Rules without arguments: strings
// ============================================================================

type _noArguments = [
  Expect<Equal<Field<'uuid'>, { field?: string }>>,
  Expect<Equal<Field<'ip'>, { field?: string }>>,
  Expect<Equal<Field<'cidr'>, { field?: string }>>,
  Expect<Equal<Field<'hostname'>, { field?: string }>>,
  Expect<Equal<Field<'base64'>, { field?: string }>>,
  Expect<Equal<Field<'hex'>, { field?: string }>>,
  Expect<Equal<Field<'mongo_id'>, { field?: string }>>,
  Expect<Equal<Field<'hex_color'>, { field?: string }>>,
  Expect<Equal<Field<'mac'>, { field?: string }>>,
  Expect<Equal<Field<'e164'>, { field?: string }>>,
  Expect<Equal<Field<'semver'>, { field?: string }>>,
  Expect<Equal<Field<'jwt'>, { field?: string }>>,
  Expect<Equal<Field<'luhn'>, { field?: string }>>,
  Expect<Equal<Field<'credit_card'>, { field?: string }>>,
  Expect<Equal<Field<'iban'>, { field?: string }>>,
  Expect<Equal<Field<['required', 'iban']>, { field: string }>>,
  Expect<Equal<Field<{ hex: [] }>, { field?: string }>>,
];

// ============================================================================
// Rules with arguments: strings too
// ============================================================================

type _withArguments = [
  Expect<Equal<Field<{ uuid: 'v4' }>, { field?: string }>>,
  Expect<Equal<Field<{ uuid: ['v4', 'v7'] }>, { field?: string }>>,
  Expect<Equal<Field<{ ip: 'v4' }>, { field?: string }>>,
  Expect<Equal<Field<{ cidr: 'v6' }>, { field?: string }>>,
  Expect<Equal<Field<{ mac: 64 }>, { field?: string }>>,
  Expect<Equal<Field<{ base64: 'url' }>, { field?: string }>>,
  Expect<Equal<Field<{ digest: 'sha256' }>, { field?: string }>>,
  Expect<Equal<Field<{ digest: ['md5', 'sha1'] }>, { field?: string }>>,
  Expect<Equal<Field<['required', { digest: 'md5' }]>, { field: string }>>,
];

// ============================================================================
// The string form: numbers become strings, string literal types of earlier rules are kept
// ============================================================================

type _stringForm = [
  Expect<Equal<Field<['positive_integer', 'luhn']>, { field?: string }>>,
  Expect<Equal<Field<['integer', 'hex']>, { field?: string }>>,
  Expect<Equal<Field<[{ one_of: [4111111111111111] }, 'credit_card']>, { field?: string }>>,
  Expect<Equal<Field<[{ one_of: ['#fff', '#000'] }, 'hex_color']>, { field?: '#fff' | '#000' }>>,
  Expect<Equal<Field<['trim', 'to_uc', 'iban']>, { field?: string }>>,
];

// ============================================================================
// camelCase names: the same types as snake_case names
// ============================================================================

type _camelCase = [
  Expect<Equal<Field<'mongoId'>, Field<'mongo_id'>>>,
  Expect<Equal<Field<'hexColor'>, Field<'hex_color'>>>,
  Expect<Equal<Field<'creditCard'>, Field<'credit_card'>>>,
  Expect<Equal<Field<['required', 'hexColor']>, { field: string }>>,
  Expect<
    Equal<
      Extract<'uuid' | 'jwt' | 'digest' | 'mongoId' | 'hexColor' | 'creditCard' | 'iban', RuleName>,
      'uuid' | 'jwt' | 'digest' | 'mongoId' | 'hexColor' | 'creditCard' | 'iban'
    >
  >,
];

// ============================================================================
// A schema with several format rules
// ============================================================================

type _schema = [
  Expect<
    Equal<
      InferFromSchema<{
        id: ['required', { uuid: 'v7' }];
        server: { ip: 'v4' };
        version: 'semver';
        token: ['required', 'jwt'];
        account: [{ remove: ' ' }, 'to_uc', 'iban'];
      }>,
      { id: string; server?: string; version?: string; token: string; account?: string }
    >
  >,
];
