// Type inference for 'variable_object' rule
import type { RuleTypeDef, InferFromSchema, LIVRSchema, Simplify } from '../../../types/inference';

/** Helper type to build discriminated union from schema map */
type BuildVariableObject<
  D extends string,
  Schemas extends Record<string, LIVRSchema>
> = {
  [K in keyof Schemas]: Simplify<
    InferFromSchema<Schemas[K]> & { readonly [P in D]: K }
  >;
}[keyof Schemas];

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    variable_object: RuleTypeDef<
      <
        D extends string,
        Schemas extends Record<string, LIVRSchema>
      >(args: readonly [D, Schemas]) => BuildVariableObject<D, Schemas>,
      false,
      false
    >;
    variableObject: RuleTypeRegistry['variable_object'];
  }
}
