// Type inference for 'max_length' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    max_length: RuleTypeDef<string, false, false>;
    maxLength: RuleTypeRegistry['max_length'];
  }
}
