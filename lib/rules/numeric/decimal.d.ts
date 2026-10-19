// Type inference for 'decimal' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    decimal: As<number>;
  }
}
