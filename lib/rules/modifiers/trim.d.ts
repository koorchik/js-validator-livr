// Type inference for 'trim' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    trim: RuleTypeDef<string, false, false>;
  }
}
