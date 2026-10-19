// Another rule package with types in RuleTypes. It declares `uuid` too, with the same type,
// and changes a built-in rule: `iso_date` gives a Date

import type { As, Present, RuleType } from 'livr/types/inference';

interface Money<Currency> {
  amount: number;
  currency: Currency;
}

/**
 * { money: 'USD' } -> Money<'USD'>. `this` is not allowed in an object type literal
 * ({ currency: this['args'][0] }), so the output is a type with a parameter
 */
interface MoneyType extends RuleType {
  output: Money<this['args'][0]>;
}

declare module 'livr/types/inference' {
  interface RuleTypes {
    uuid: As<string>;
    money: MoneyType;
    currency_or_default: Present<string>;
    iso_date: Date;
  }
}

type RuleFactory = (
  ...args: Array<any>
) => (value: any, params: any, outputArr: Array<any>) => string | undefined;

declare const moneyRules: Record<string, RuleFactory>;
export = moneyRules;
