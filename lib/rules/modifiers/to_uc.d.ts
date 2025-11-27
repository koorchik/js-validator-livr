// Type inference for 'to_uc' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    to_uc: RuleTypeDef<string, false, false>;
    toUc: RuleTypeRegistry['to_uc'];
  }
}
