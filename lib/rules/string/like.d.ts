// Type inference for 'like' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    like: As<string>;
  }
}
