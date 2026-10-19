// Type inference for 'url' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    url: As<string>;
  }
}
