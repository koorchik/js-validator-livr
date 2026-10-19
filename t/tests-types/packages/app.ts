// t/tests-types/packages/app.ts
// An application with rule packages, verified via `npx tsc --noEmit -p t/tests-types/packages`.
// Packages and the application add rule types to 'livr/types/inference', like installed ones

import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';
import type { AliasType, As } from 'livr/types/inference';
import extraRules from 'livr-extra-rules';
import idRules from 'livr-id-rules';
import moneyRules from 'livr-money-rules';
import type { Expect, Equal } from '../utils';

LIVR.Validator.registerDefaultRules({ ...extraRules, ...idRules, ...moneyRules });

/** Output type of a schema with one field */
type Field<Rules> = InferFromSchema<{ field: Rules }>;

// The application keeps prices as strings: an alias replaces the built-in `decimal` rule
const priceRules = ['string', { like: '^\\d+\\.\\d{2}$' }] as const;
LIVR.Validator.registerAliasedDefaultRule({ name: 'decimal', rules: priceRules });

// And an alias of its own
const emailRules = ['required', 'trim', 'email', 'to_lc'] as const;
LIVR.Validator.registerAliasedDefaultRule({ name: 'account_email', rules: emailRules });

declare module 'livr/types/inference' {
  interface RuleTypes {
    decimal: AliasType<typeof priceRules>;
    account_email: AliasType<typeof emailRules>;
    // The same type as in livr-id-rules
    mongo_id: As<string>;
    // @ts-expect-error A different type for a rule of a package is a conflict (TS2717)
    id_of: string;
  }
}

// Rules of livr-extra-rules, a package with the deprecated registries
type _extraRules = [
  Expect<Equal<Field<'credit_card'>, { field?: string }>>,
  Expect<Equal<Field<'creditCard'>, { field?: string }>>,
  Expect<Equal<Field<'boolean'>, { field?: boolean }>>,
  Expect<Equal<Field<{ is: 'active' }>, { field: 'active' }>>,
  Expect<Equal<Field<{ instance_of: DateConstructor }>, { field?: Date }>>,
  Expect<Equal<Field<{ instanceOf: DateConstructor }>, { field?: Date }>>,
  Expect<Equal<Field<['list_items_unique', { list_length: 5 }]>, { field?: unknown }>>,
  Expect<Equal<Field<['required', 'ipv4']>, { field: string }>>,
];

// Rules of packages with RuleTypes
type _packages = [
  Expect<Equal<Field<'uuid'>, { field?: string }>>,
  Expect<Equal<Field<'mongoId'>, { field?: string }>>,
  Expect<Equal<Field<{ id_of: 'user' }>, { field?: `user_${string}` }>>,
  Expect<Equal<Field<{ idOf: 'user' }>, { field?: `user_${string}` }>>,
  Expect<Equal<Field<{ money: 'USD' }>, { field?: { amount: number; currency: 'USD' } }>>,
  Expect<Equal<Field<'currency_or_default'>, { field: string }>>,
];

// Types of built-in rules replaced by packages and the application.
// livr-money-rules comes before livr-extra-rules, which also declares iso_date
type _overrides = [
  Expect<Equal<Field<'iso_date'>, { field?: Date }>>,
  Expect<Equal<Field<'isoDate'>, { field?: Date }>>,
  Expect<Equal<Field<'decimal'>, { field?: string }>>,
  Expect<Equal<Field<['required', 'decimal']>, { field: string }>>,
  // Other built-in rules keep their types
  Expect<Equal<Field<'positive_decimal'>, { field?: number }>>,
  Expect<Equal<Field<'string'>, { field?: string }>>,
];

// A schema with rules of all of them
const orderSchema = {
  id: ['required', 'uuid'],
  owner: ['required', { id_of: 'user' }],
  email: 'account_email',
  total: ['required', { money: 'EUR' }],
  price: 'decimal',
  paid: 'boolean',
  status: ['required', { one_of: ['new', 'paid'] }],
  created: ['required', 'iso_date'],
  items: {
    list_of_objects: {
      sku: ['required', 'mongo_id'],
      quantity: ['required', 'positive_integer'],
    },
  },
} as const;

type Order = InferFromSchema<typeof orderSchema>;

type _order = Expect<
  Equal<
    Order,
    {
      id: string;
      owner: `user_${string}`;
      email: string;
      total: { amount: number; currency: 'EUR' };
      price?: string;
      paid?: boolean;
      status: 'new' | 'paid';
      created: Date;
      items?: { sku: string; quantity: number }[];
    }
  >
>;

const validator = new LIVR.Validator<Order>(orderSchema);
const order = validator.validate({});
if (order) {
  const created: Date = order.created;
  const currency: 'EUR' = order.total.currency;
}
