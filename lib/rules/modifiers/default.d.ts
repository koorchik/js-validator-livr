// Type inference for 'default' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    default: RuleTypeDef<
      <T>(defaultValue: T) => T,
      false,
      true  // Sets defaultEffect - makes field non-optional
    >;
  }
}
