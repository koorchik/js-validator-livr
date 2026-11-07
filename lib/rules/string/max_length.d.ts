// Type inference for 'max_length' rule
import type { As } from '../../../types/inference';

/** A number, also as a string: 5 or "5" */
type NumberArg = number | `${number}`;

type MaxLengthParams = readonly [length: NumberArg, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    max_length: As<string, MaxLengthParams>;
  }
}
