// Type inference for 'max_number' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    max_number: As<number>;
  }
}
