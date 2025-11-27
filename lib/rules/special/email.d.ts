// Type inference for 'email' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    email: RuleTypeDef<string, false, false>;
  }
}
