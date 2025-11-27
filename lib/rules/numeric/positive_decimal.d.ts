// Type inference for 'positive_decimal' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    positive_decimal: RuleTypeDef<number, false, false>;
    positiveDecimal: RuleTypeRegistry['positive_decimal'];
  }
}
