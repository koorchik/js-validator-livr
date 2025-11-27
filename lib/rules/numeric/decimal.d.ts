// Type inference for 'decimal' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    decimal: RuleTypeDef<number, false, false>;
  }
}
