// Type inference for 'length_between' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    length_between: As<string>;
  }
}
