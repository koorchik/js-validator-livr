// Type inference for 'required' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    required: RuleTypeDef<unknown, true, false>;
  }
}
