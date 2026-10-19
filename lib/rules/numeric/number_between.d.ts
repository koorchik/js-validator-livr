// Type inference for 'number_between' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    number_between: As<number>;
  }
}
