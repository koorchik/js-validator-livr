// Type inference for 'length_equal' rule
import type { As } from '../../../types/inference';

/** A number, also as a string: 5 or "5" */
type NumberArg = number | `${number}`;

type LengthEqualParams = readonly [length: NumberArg, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    length_equal: As<string, LengthEqualParams>;
  }
}
