// Type inference for 'any_object' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    any_object: RuleTypeDef<Record<string, unknown>, false, false>;
    anyObject: RuleTypeRegistry['any_object'];
  }
}
