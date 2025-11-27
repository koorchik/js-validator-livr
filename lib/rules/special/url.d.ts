// Type inference for 'url' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    url: RuleTypeDef<string, false, false>;
  }
}
