// Type inference for 'equal_to_field' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    equal_to_field: RuleTypeDef<string, false, false>;
    equalToField: RuleTypeRegistry['equal_to_field'];
  }
}
