// Type inference for 'max_length' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    max_length: As<string>;
  }
}
