// Type inference for 'min_length' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    min_length: RuleTypeDef<string, false, false>;
    minLength: RuleTypeRegistry['min_length'];
  }
}
