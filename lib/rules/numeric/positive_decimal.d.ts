// Type inference for 'positive_decimal' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // Arguments are ignored, as in LIVR 2.0
    positive_decimal: As<number, readonly unknown[]>;
  }
}
