// Type inference for 'url' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // Arguments are ignored, as in LIVR 2.0
    url: As<string, readonly unknown[]>;
  }
}
