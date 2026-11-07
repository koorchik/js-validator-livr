// Type inference for 'number_between' rule
import type { As } from '../../../types/inference';

/** A number, also as a string: 5 or "5" */
type NumberArg = number | `${number}`;

type NumberBetweenParams = readonly [min: NumberArg, max: NumberArg, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    number_between: As<number, NumberBetweenParams>;
  }
}
