// Type inference for 'nested_object' rule
import type { RuleType, InferFromSchema, LIVRSchema } from '../../../types/inference';

/** { nested_object: schema } -> the type of the schema */
interface NestedObjectType extends RuleType {
  params: readonly [schema: LIVRSchema];
  output: InferFromSchema<this['args'][0]>;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    nested_object: NestedObjectType;
  }
}
