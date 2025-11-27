// Type inference for 'list_of_different_objects' rule
import type { RuleTypeDef, InferFromSchema, LIVRSchema, Simplify } from '../../../types/inference';

/** Helper type to build discriminated union from schema map */
type BuildDiscriminatedUnion<
  D extends string,
  Schemas extends Record<string, LIVRSchema>
> = {
  [K in keyof Schemas]: Simplify<
    InferFromSchema<Schemas[K]> & { readonly [P in D]: K }
  >;
}[keyof Schemas];

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    list_of_different_objects: RuleTypeDef<
      <
        D extends string,
        Schemas extends Record<string, LIVRSchema>
      >(args: readonly [D, Schemas]) => Array<BuildDiscriminatedUnion<D, Schemas>>,
      false,
      false
    >;
    listOfDifferentObjects: RuleTypeRegistry['list_of_different_objects'];
  }
}
