// Type inference for 'min_number' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    min_number: As<number>;
  }
}
