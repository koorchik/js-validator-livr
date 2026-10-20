// t/tests-types/strict/app.ts
// Strict mode (`strictRules: true`): only rules with a type, verified via
// `npx tsc --noEmit -p t/tests-types/strict`. Strict mode is global, so it is a program of its own

import LIVR from 'livr';
import type { InferFromSchema, LIVRSchema, LIVRRuleDefinition, RuleName } from 'livr/types';
import type { AliasType, As, InferRuleType, RuleType } from 'livr/types/inference';
import extraRules from 'livr-extra-rules';
import idRules from 'livr-id-rules';
import type { Expect, Equal } from '../utils';

/** A custom meta rule with `params`: rules in its arguments are checked */
interface DictOfType extends RuleType {
  params: readonly LIVRRuleDefinition[];
  output: Record<string, InferRuleType<this['args']>>;
}

/** A custom meta rule without `params`: its arguments are not checked */
interface LooseDictOfType extends RuleType {
  output: Record<string, InferRuleType<this['args']>>;
}

const phoneRules = ['string', { like: '^\\+?[0-9]{10,15}$' }] as const;

declare module 'livr/types/inference' {
  interface TypeOptions {
    strictRules: true;
  }

  interface RuleTypes {
    phone: AliasType<typeof phoneRules>;
    local_alias: AliasType<['required', 'positive_integer']>;
    to_date: Date;
    dict_of: DictOfType;
    loose_dict_of: LooseDictOfType;
    // Named like a method of arrays: an array is not a rule object
    sort: As<unknown[]>;
  }
}

/** `true` when the schema has only rules with a type */
type Valid<S> = S extends LIVRSchema ? true : false;

// ============================================================================
// Rules with a type
// ============================================================================

const schema = {
  // Built-in rules, also camelCase names
  name: ['required', 'string', 'trim', { max_length: 20 }, { minLength: 1 }, 'to_lc'],
  age: ['positive_integer', { number_between: [18, 99] }],
  role: { one_of: ['admin', 'user'] },
  roles: { one_of: [['admin', 'user']] },
  email: ['required', 'email', { equal_to_field: 'email2' }, 'toLc'],
  page: { default: 1 },
  // Custom rules, aliases and rules of packages
  phone: 'phone',
  createdAt: ['iso_date', 'to_date'],
  id: ['required', 'uuid', 'mongo_id', { id_of: 'user' }],
  card: ['creditCard', 'credit_card'],
  status: { is: 'active' },
  // Meta rules, with all forms of their arguments
  address: { nested_object: { city: ['required', 'string'], zip: 'positive_integer' } },
  tags: { list_of: 'string' },
  tags2: { list_of: ['required', 'string'] },
  tags3: { list_of: [['required', 'string']] },
  items: { list_of_objects: { id: ['required', 'integer'] } },
  key: { or: ['integer', ['required', 'uuid'], { eq: 'none' }] },
  pet: {
    variable_object: [
      'type',
      { cat: { type: 'required', meow: 'string' }, dog: { bark: 'string' } },
    ],
  },
  pets: { list_of_different_objects: ['type', { cat: { meow: 'string' } }] },
  scores: { dict_of: ['required', 'integer'] },
  counts: { loose_dict_of: 'integer' },
} as const;

LIVR.Validator.registerDefaultRules({ ...extraRules, ...idRules });
LIVR.Validator.registerDefaultRules({ to_date: () => () => undefined });
LIVR.Validator.registerAliasedDefaultRule({
  name: 'phone',
  rules: phoneRules,
  error: 'WRONG_PHONE',
});

const validator = new LIVR.Validator<InferFromSchema<typeof schema>>(schema);
validator.registerAliasedRule({ name: 'local_alias', rules: ['required', 'positive_integer'] });
validator.registerRules({ dict_of: () => () => undefined, sort: () => () => undefined });

// The schema is checked written in place and with `satisfies`
new LIVR.Validator({
  name: ['required', 'string'],
  address: { nested_object: { city: 'string' } },
});
const satisfied = { name: ['required', { max_length: 5 }] } as const satisfies LIVRSchema;

// Types are the same as without strict mode
type _types = [
  Expect<Valid<typeof schema>>,
  Expect<Valid<typeof satisfied>>,
  Expect<Equal<InferFromSchema<typeof satisfied>, { name: string }>>,
  Expect<
    Equal<InferFromSchema<typeof schema>['address'], { city: string; zip?: number } | undefined>
  >,
  Expect<Equal<InferFromSchema<typeof schema>['phone'], string | undefined>>,
  Expect<Equal<InferFromSchema<typeof schema>['key'], number | string | 'none' | undefined>>,
  Expect<Equal<InferFromSchema<typeof schema>['scores'], Record<string, number> | undefined>>,
  Expect<
    Equal<
      Extract<'phone' | 'toDate' | 'creditCard' | 'maxLength', RuleName>,
      'phone' | 'toDate' | 'creditCard' | 'maxLength'
    >
  >,
];

// ============================================================================
// Rules without a type
// ============================================================================

type _withoutType = [
  // A misspelled or unknown rule, alone or in a list of rules
  Expect<Equal<Valid<{ f: 'strng' }>, false>>,
  Expect<Equal<Valid<{ f: ['required', 'strng'] }>, false>>,
  Expect<Equal<Valid<{ f: { max_lenght: 5 } }>, false>>,
  Expect<Equal<Valid<{ f: ['required', { max_lenght: 5 }] }>, false>>,
  Expect<Equal<Valid<{ f: 'maxLenght' }>, false>>,
  // Only the camelCase names of RuleTypes and BuiltInRuleTypes are found, like their types
  Expect<Equal<Valid<{ f: 'isoDate' }>, true>>,
  Expect<Equal<Valid<{ f: 'positive_Integer' }>, false>>,
  // Not a rule: a number, a list in a list of rules
  Expect<Equal<Valid<{ f: ['required', 5] }>, false>>,
  Expect<Equal<Valid<{ f: ['required', ['string']] }>, false>>,
  // Rules in the arguments of meta rules
  Expect<Equal<Valid<{ f: { nested_object: { a: 'strng' } } }>, false>>,
  Expect<Equal<Valid<{ f: { nested_object: [{ a: 'strng' }] } }>, false>>,
  Expect<Equal<Valid<{ f: { list_of_objects: { a: ['required', 'strng'] } } }>, false>>,
  Expect<Equal<Valid<{ f: { list_of: 'strng' } }>, false>>,
  Expect<Equal<Valid<{ f: { list_of: ['required', 'strng'] } }>, false>>,
  Expect<Equal<Valid<{ f: { list_of: [['required', 'strng']] } }>, false>>,
  Expect<Equal<Valid<{ f: { list_of: { nested_object: { a: 'strng' } } } }>, false>>,
  Expect<Equal<Valid<{ f: { or: ['integer', 'strng'] } }>, false>>,
  Expect<Equal<Valid<{ f: { or: ['integer', ['required', 'strng']] } }>, false>>,
  Expect<Equal<Valid<{ f: { variable_object: ['type', { a: { b: 'strng' } }] } }>, false>>,
  Expect<
    Equal<Valid<{ f: { list_of_different_objects: ['type', { a: { b: 'strng' } }] } }>, false>
  >,
  Expect<Equal<Valid<{ f: { dict_of: ['required', 'strng'] } }>, false>>,
  // Arguments of a rule without `params` are not checked
  Expect<Equal<Valid<{ f: { loose_dict_of: ['required', 'strng'] } }>, true>>,
  // Arguments that do not fit `params` of meta rules
  Expect<Equal<Valid<{ f: { nested_object: 'string' } }>, false>>,
  Expect<Equal<Valid<{ f: { variable_object: 'type' } }>, false>>,
  Expect<Equal<Valid<{ f: { list_of: [['required'], 'string'] } }>, false>>,
];

// Schemas nested 16 levels deep (8 levels of `or`) are checked to the bottom. TypeScript stops
// at about 100 levels of comparing types, deeper schemas get "Excessive stack depth comparing
// types" in strict mode: they are passed `as LIVRSchema`
const deep0 = { leaf: ['required', 'string'] } as const;
const deep1 = { x: ['required', { nested_object: deep0 }] } as const;
const deep2 = { x: ['required', { nested_object: deep1 }] } as const;
const deep3 = { x: ['required', { nested_object: deep2 }] } as const;
const deep4 = { x: ['required', { nested_object: deep3 }] } as const;
const deep5 = { x: ['required', { nested_object: deep4 }] } as const;
const deep6 = { x: ['required', { nested_object: deep5 }] } as const;
const deep7 = { x: ['required', { nested_object: deep6 }] } as const;
const deep8 = { x: ['required', { nested_object: deep7 }] } as const;
const deep9 = { x: ['required', { nested_object: deep8 }] } as const;
const deep10 = { x: ['required', { nested_object: deep9 }] } as const;
const deep11 = { x: ['required', { nested_object: deep10 }] } as const;
const deep12 = { x: ['required', { nested_object: deep11 }] } as const;
const deep13 = { x: ['required', { nested_object: deep12 }] } as const;
const deep14 = { x: ['required', { nested_object: deep13 }] } as const;
const deep15 = { x: ['required', { nested_object: deep14 }] } as const;
const deep16 = { x: ['required', { nested_object: deep15 }] } as const;
new LIVR.Validator(deep16);
const typo0 = { leaf: ['required', 'strng'] } as const;
const typo1 = { x: ['required', { nested_object: typo0 }] } as const;
const typo2 = { x: ['required', { nested_object: typo1 }] } as const;
const typo3 = { x: ['required', { nested_object: typo2 }] } as const;
const typo4 = { x: ['required', { nested_object: typo3 }] } as const;
const typo5 = { x: ['required', { nested_object: typo4 }] } as const;
const typo6 = { x: ['required', { nested_object: typo5 }] } as const;
const typo7 = { x: ['required', { nested_object: typo6 }] } as const;
const typo8 = { x: ['required', { nested_object: typo7 }] } as const;
const typo9 = { x: ['required', { nested_object: typo8 }] } as const;
const typo10 = { x: ['required', { nested_object: typo9 }] } as const;
const typo11 = { x: ['required', { nested_object: typo10 }] } as const;
const typo12 = { x: ['required', { nested_object: typo11 }] } as const;
const typo13 = { x: ['required', { nested_object: typo12 }] } as const;
const typo14 = { x: ['required', { nested_object: typo13 }] } as const;
const typo15 = { x: ['required', { nested_object: typo14 }] } as const;
const typo16 = { x: ['required', { nested_object: typo15 }] } as const;
// @ts-expect-error A rule without a type 16 levels deep
new LIVR.Validator(typo16);
const or0 = { leaf: ['required', 'string'] } as const;
const or1 = { x: ['required', { or: [{ nested_object: or0 }, 'string'] }] } as const;
const or2 = { x: ['required', { or: [{ nested_object: or1 }, 'string'] }] } as const;
const or3 = { x: ['required', { or: [{ nested_object: or2 }, 'string'] }] } as const;
const or4 = { x: ['required', { or: [{ nested_object: or3 }, 'string'] }] } as const;
const or5 = { x: ['required', { or: [{ nested_object: or4 }, 'string'] }] } as const;
const or6 = { x: ['required', { or: [{ nested_object: or5 }, 'string'] }] } as const;
const or7 = { x: ['required', { or: [{ nested_object: or6 }, 'string'] }] } as const;
const or8 = { x: ['required', { or: [{ nested_object: or7 }, 'string'] }] } as const;
new LIVR.Validator(or8);
const deep17 = { x: ['required', { nested_object: deep16 }] } as const;
const deep24 = {
  a: {
    nested_object: {
      b: {
        nested_object: {
          c: {
            nested_object: {
              d: {
                nested_object: {
                  e: { nested_object: { f: { nested_object: { g: { nested_object: deep17 } } } } },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
new LIVR.Validator<InferFromSchema<typeof deep24>>(deep24 as LIVRSchema);

// ============================================================================
// Errors in the validator API
// ============================================================================

const misspelled = { name: ['required', 'strng'] } as const;
// @ts-expect-error A rule without a type in a schema
new LIVR.Validator(misspelled);
// @ts-expect-error Written in place
new LIVR.Validator({ name: ['required', { max_lenght: 5 }] });
// @ts-expect-error With satisfies
const typoSatisfies = { a: { nested_object: { b: 'strng' } } } as const satisfies LIVRSchema;

// A schema without `as const` has `string` instead of rule names
const notConst = { name: ['required', 'string'] };
// @ts-expect-error
new LIVR.Validator(notConst);

// Schemas from JSON or built at runtime: a type assertion
const fromJson: Record<string, string | string[]> = JSON.parse(
  '{ "name": ["required", "string"] }'
);
new LIVR.Validator(fromJson as LIVRSchema);
const fromAny: any = {};
new LIVR.Validator(fromAny);

// @ts-expect-error An alias without a type
LIVR.Validator.registerAliasedDefaultRule({ name: 'phone2', rules: phoneRules });
// @ts-expect-error A local alias without a type
validator.registerAliasedRule({ name: 'local_alias2', rules: 'required' });
// @ts-expect-error Rules of an alias without a type
LIVR.Validator.registerAliasedDefaultRule({ name: 'phone', rules: ['required', 'strng'] });

// @ts-expect-error A rule without a type
LIVR.Validator.registerDefaultRules({ to_dat: () => () => undefined });
// @ts-expect-error A local rule without a type
validator.registerRules({ dict: () => () => undefined });

export { typoSatisfies };
