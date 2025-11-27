// Type inference for 'like' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    like: RuleTypeDef<string, false, false>;
  }
}
