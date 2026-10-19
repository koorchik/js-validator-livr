// Type inference for 'string' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    string: As<string>;
  }
}
