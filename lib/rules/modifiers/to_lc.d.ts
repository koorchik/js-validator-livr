// Type inference for 'to_lc' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    to_lc: RuleTypeDef<string, false, false>;
    toLc: RuleTypeRegistry['to_lc'];
  }
}
