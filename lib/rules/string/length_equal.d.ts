// Type inference for 'length_equal' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    length_equal: RuleTypeDef<string, false, false>;
    lengthEqual: RuleTypeRegistry['length_equal'];
  }
}
