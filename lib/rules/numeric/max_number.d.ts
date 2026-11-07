// Type inference for 'max_number' rule
import type { As } from '../../../types/inference';

/** A number, also as a string: 5 or "5" */
type NumberArg = number | `${number}`;

type MaxNumberParams = readonly [max: NumberArg, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    max_number: As<number, MaxNumberParams>;
  }
}
