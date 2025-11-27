// Type inference for 'nested_object' rule
import type { RuleTypeDef, InferFromSchema, LIVRSchema } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    nested_object: RuleTypeDef<
      <S extends LIVRSchema>(schema: S) => InferFromSchema<S>,
      false,
      false
    >;
    nestedObject: RuleTypeRegistry['nested_object'];
  }
}
