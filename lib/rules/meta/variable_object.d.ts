// Type inference for 'variable_object' rule
import type { RuleType, InferFromSchema, LIVRSchema, Simplify } from '../../../types/inference';

/**
 * A union of the schema types, one per selector value. The selector field is in the output
 * when the schema of the value has it, then it is the selector value
 */
type BuildVariableObject<Selector, Schemas> = Selector extends string
  ? Schemas extends Record<string, object>
    ? {
        [K in keyof Schemas]: Selector extends keyof Schemas[K]
          ? Simplify<InferFromSchema<Schemas[K]> & { [P in Selector]: K }>
          : InferFromSchema<Schemas[K]>;
      }[keyof Schemas]
    : unknown
  : unknown;

/** { variable_object: [selectorField, { selectorValue: schema }] } */
interface VariableObjectType extends RuleType {
  params: readonly [selectorField: string, schemas: { readonly [value: string]: LIVRSchema }];
  output: BuildVariableObject<this['args'][0], this['args'][1]>;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    variable_object: VariableObjectType;
  }
}
