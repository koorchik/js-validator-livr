// Type inference for 'max_number' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    max_number: RuleTypeDef<number, false, false>;
    maxNumber: RuleTypeRegistry['max_number'];
  }
}
