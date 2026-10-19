// Type inference for 'positive_integer' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    positive_integer: As<number>;
  }
}
