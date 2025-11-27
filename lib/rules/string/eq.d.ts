// Type inference for 'eq' rule
import type { RuleTypeDef, LIVRPrimitive } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    eq: RuleTypeDef<
      <T extends LIVRPrimitive>(value: T) => T,
      false,
      false
    >;
  }
}
