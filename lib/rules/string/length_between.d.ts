// Type inference for 'length_between' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    length_between: RuleTypeDef<string, false, false>;
    lengthBetween: RuleTypeRegistry['length_between'];
  }
}
