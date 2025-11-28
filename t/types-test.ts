// t/types-test.ts
// Type inference tests - verified at compile time via `npx tsc --noEmit`

import type { InferFromSchema } from '../types';

// ============================================================================
// Test Utilities
// ============================================================================

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
    ? true
    : false;

// ============================================================================
// Default Rule - Widening Tests
// ============================================================================

// Test: Single number literal widens to number
const schemaDefaultNumber = {
  count: { default: 10 },
} as const;
type DefaultNumber = InferFromSchema<typeof schemaDefaultNumber>;
type _test1 = Expect<Equal<DefaultNumber, { count: number }>>;

// Test: Single string literal widens to string
const schemaDefaultString = {
  name: { default: 'anonymous' },
} as const;
type DefaultString = InferFromSchema<typeof schemaDefaultString>;
type _test2 = Expect<Equal<DefaultString, { name: string }>>;

// Test: Single boolean literal widens to boolean
const schemaDefaultBoolean = {
  enabled: { default: true },
} as const;
type DefaultBoolean = InferFromSchema<typeof schemaDefaultBoolean>;
type _test3 = Expect<Equal<DefaultBoolean, { enabled: boolean }>>;

// Test: false literal widens to boolean
const schemaDefaultFalse = {
  disabled: { default: false },
} as const;
type DefaultFalse = InferFromSchema<typeof schemaDefaultFalse>;
type _test3b = Expect<Equal<DefaultFalse, { disabled: boolean }>>;

// ============================================================================
// Default Rule - Type Assertion Override Tests
// ============================================================================

// Test: Single literal with assertion still widens (same as without assertion)
const schemaDefaultLiteralNumber = {
  code: { default: 42 as 42 },
} as const;
type DefaultLiteralNumber = InferFromSchema<typeof schemaDefaultLiteralNumber>;
type _test4 = Expect<Equal<DefaultLiteralNumber, { code: number }>>;  // Widens to number

// Test: Single literal string with assertion still widens
const schemaDefaultLiteralString = {
  type: { default: 'user' as 'user' },
} as const;
type DefaultLiteralString = InferFromSchema<typeof schemaDefaultLiteralString>;
type _test4b = Expect<Equal<DefaultLiteralString, { type: string }>>;  // Widens to string

// Test: Type assertion with union type preserves union
const schemaDefaultUnion = {
  status: { default: 'ACTIVE' as 'ACTIVE' | 'PENDING' },
} as const;
type DefaultUnion = InferFromSchema<typeof schemaDefaultUnion>;
type _test5 = Expect<Equal<DefaultUnion, { status: 'ACTIVE' | 'PENDING' }>>;

// Test: Type assertion with larger union preserves union
const schemaDefaultLargerUnion = {
  status: { default: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'CLOSED' },
} as const;
type DefaultLargerUnion = InferFromSchema<typeof schemaDefaultLargerUnion>;
type _test5b = Expect<Equal<DefaultLargerUnion, { status: 'ACTIVE' | 'PENDING' | 'CLOSED' }>>;

// Test: as const on single literal still widens (as const doesn't make it a union)
const schemaDefaultConst = {
  type: { default: 'user' as const },
} as const;
type DefaultConst = InferFromSchema<typeof schemaDefaultConst>;
type _test6 = Expect<Equal<DefaultConst, { type: string }>>;  // Widens to string

// ============================================================================
// one_of Rule - Should NOT be affected (regression test)
// ============================================================================

// Test: one_of still produces union of literals
const schemaOneOf = {
  role: { one_of: ['admin', 'user', 'guest'] as const },
} as const;
type OneOf = InferFromSchema<typeof schemaOneOf>;
type _test7 = Expect<Equal<OneOf, { role?: 'admin' | 'user' | 'guest' }>>;

// Test: one_of with two boolean values (true | false equals boolean)
const schemaOneOfTwo = {
  active: { one_of: [true, false] as const },
} as const;
type OneOfTwo = InferFromSchema<typeof schemaOneOfTwo>;
type _test7b = Expect<Equal<OneOfTwo, { active?: boolean }>>;  // true | false === boolean

// ============================================================================
// eq Rule - Should NOT be affected (regression test)
// ============================================================================

// Test: eq still produces literal type
const schemaEq = {
  type: { eq: 'admin' as const },
} as const;
type EqType = InferFromSchema<typeof schemaEq>;
type _test8 = Expect<Equal<EqType, { type?: 'admin' }>>;

// ============================================================================
// Combined Tests
// ============================================================================

// Test: Mixed schema with default and other rules
const schemaMixed = {
  name: ['required', 'string'],
  count: { default: 0 },
  status: { default: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'CLOSED' },
  role: { one_of: ['admin', 'user'] as const },
} as const;
type Mixed = InferFromSchema<typeof schemaMixed>;
type _test9 = Expect<Equal<Mixed, {
  name: string;
  count: number;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED';
  role?: 'admin' | 'user';
}>>;

// Test: Default with other rules in chain
const schemaDefaultWithRules = {
  age: [{ default: 18 }, 'positive_integer'],
} as const;
type DefaultWithRules = InferFromSchema<typeof schemaDefaultWithRules>;
type _test10 = Expect<Equal<DefaultWithRules, { age: number }>>;

// Test: Complex nested schema with defaults
const schemaNestedDefaults = {
  config: {
    nested_object: {
      timeout: { default: 5000 },
      retries: { default: 3 },
      mode: { default: 'auto' as 'auto' | 'manual' },
    },
  },
} as const;
type NestedDefaults = InferFromSchema<typeof schemaNestedDefaults>;
type _test11 = Expect<Equal<NestedDefaults, {
  config?: {
    timeout: number;
    retries: number;
    mode: 'auto' | 'manual';
  };
}>>;
