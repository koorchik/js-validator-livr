// Type inference for 'not_empty' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    not_empty: RuleTypeDef<string, false, false>;
    notEmpty: RuleTypeRegistry['not_empty'];
  }
}
