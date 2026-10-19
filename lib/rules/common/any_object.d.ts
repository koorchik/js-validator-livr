// Type inference for 'any_object' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    any_object: As<Record<string, unknown>>;
  }
}
