// Type inference for 'iso_date' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    iso_date: RuleTypeDef<string, false, false>;
    isoDate: RuleTypeRegistry['iso_date'];
  }
}
