// Type inference for 'list_of_different_objects' rule
import type { RuleType, InferFromSchema, LIVRSchema, Simplify } from '../../../types/inference';

/**
 * A union of the schema types, one per selector value. The selector field is in the output
 * when the schema of the value has it, then it is the selector value
 */
type BuildDiscriminatedUnion<Selector, Schemas> = Selector extends string
  ? Schemas extends Record<string, LIVRSchema>
    ? {
        [K in keyof Schemas]: Selector extends keyof Schemas[K]
          ? Simplify<InferFromSchema<Schemas[K]> & { [P in Selector]: K }>
          : InferFromSchema<Schemas[K]>;
      }[keyof Schemas]
    : unknown
  : unknown;

/** { list_of_different_objects: [selectorField, { selectorValue: schema }] } */
interface ListOfDifferentObjectsType extends RuleType {
  output: Array<BuildDiscriminatedUnion<this['args'][0], this['args'][1]>>;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    list_of_different_objects: ListOfDifferentObjectsType;
  }
}
