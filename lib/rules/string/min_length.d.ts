// Type inference for 'min_length' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    min_length: As<string>;
  }
}
