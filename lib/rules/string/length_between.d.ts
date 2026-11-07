// Type inference for 'length_between' rule
import type { As } from '../../../types/inference';

/** A number, also as a string: 5 or "5" */
type NumberArg = number | `${number}`;

type LengthBetweenParams = readonly [min: NumberArg, max: NumberArg, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    length_between: As<string, LengthBetweenParams>;
  }
}
