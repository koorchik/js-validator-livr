// Type inference for 'any_object' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // Arguments are ignored, as in LIVR 2.0
    any_object: As<Record<string, unknown>, readonly unknown[]>;
  }
}
