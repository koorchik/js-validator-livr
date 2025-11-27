// Type inference for 'not_empty_list' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    not_empty_list: RuleTypeDef<unknown[], false, false>;
    notEmptyList: RuleTypeRegistry['not_empty_list'];
  }
}
