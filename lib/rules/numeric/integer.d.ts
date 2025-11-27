// Type inference for 'integer' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    integer: RuleTypeDef<number, false, false>;
  }
}
