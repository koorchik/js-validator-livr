// Type inference for 'string' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // Arguments are ignored, as in LIVR 2.0
    string: As<string, readonly unknown[]>;
  }
}
