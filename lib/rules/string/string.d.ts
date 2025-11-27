// Type inference for 'string' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    string: RuleTypeDef<string, false, false>;
  }
}
