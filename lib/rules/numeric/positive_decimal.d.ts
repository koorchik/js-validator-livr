// Type inference for 'positive_decimal' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    positive_decimal: As<number>;
  }
}
