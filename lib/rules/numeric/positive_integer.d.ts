// Type inference for 'positive_integer' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    positive_integer: RuleTypeDef<number, false, false>;
    positiveInteger: RuleTypeRegistry['positive_integer'];
  }
}
