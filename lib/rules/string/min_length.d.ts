// Type inference for 'min_length' rule
import type { As } from '../../../types/inference';

/** A number, also as a string: 5 or "5" */
type NumberArg = number | `${number}`;

type MinLengthParams = readonly [length: NumberArg, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    min_length: As<string, MinLengthParams>;
  }
}
