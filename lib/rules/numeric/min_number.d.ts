// Type inference for 'min_number' rule
import type { As } from '../../../types/inference';

/** A number, also as a string: 5 or "5" */
type NumberArg = number | `${number}`;

type MinNumberParams = readonly [min: NumberArg, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    min_number: As<number, MinNumberParams>;
  }
}
