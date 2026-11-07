// Type inference for 'email' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // Arguments are ignored, as in LIVR 2.0
    email: As<string, readonly unknown[]>;
  }
}
