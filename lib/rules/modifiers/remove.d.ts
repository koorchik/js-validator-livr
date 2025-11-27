// Type inference for 'remove' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    remove: RuleTypeDef<string, false, false>;
  }
}
