// Type inference for 'length_equal' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    length_equal: As<string>;
  }
}
