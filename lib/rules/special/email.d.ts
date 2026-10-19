// Type inference for 'email' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    email: As<string>;
  }
}
