// Type inference for 'one_of' rule
import type { RuleTypeDef, LIVRPrimitive } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    one_of: RuleTypeDef<
      <T extends readonly LIVRPrimitive[]>(values: T) => T[number],
      false,
      false
    >;
    oneOf: RuleTypeRegistry['one_of'];
  }
}
