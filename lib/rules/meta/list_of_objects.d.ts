// Type inference for 'list_of_objects' rule
import type { RuleTypeDef, InferFromSchema, LIVRSchema } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    list_of_objects: RuleTypeDef<
      <S extends LIVRSchema>(schema: S) => Array<InferFromSchema<S>>,
      false,
      false
    >;
    listOfObjects: RuleTypeRegistry['list_of_objects'];
  }
}
