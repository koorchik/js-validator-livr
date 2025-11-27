// Type inference for 'number_between' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    number_between: RuleTypeDef<number, false, false>;
    numberBetween: RuleTypeRegistry['number_between'];
  }
}
