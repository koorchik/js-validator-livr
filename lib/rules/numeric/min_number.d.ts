// Type inference for 'min_number' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    min_number: RuleTypeDef<number, false, false>;
    minNumber: RuleTypeRegistry['min_number'];
  }
}
