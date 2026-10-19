// Type inference for 'integer' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    integer: As<number>;
  }
}
