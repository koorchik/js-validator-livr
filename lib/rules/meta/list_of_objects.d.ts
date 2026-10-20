// Type inference for 'list_of_objects' rule
import type { RuleType, InferFromSchema, LIVRSchema } from '../../../types/inference';

/** { list_of_objects: schema } -> an array of the schema type */
interface ListOfObjectsType extends RuleType {
  params: readonly [schema: LIVRSchema];
  output: Array<InferFromSchema<this['args'][0]>>;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    list_of_objects: ListOfObjectsType;
  }
}
