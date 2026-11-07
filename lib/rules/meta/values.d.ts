// Type inference for 'values' rule
import type { RuleType, InferRuleType, LIVRRuleDefinition } from '../../../types/inference';

/** A single rule, not a list */
type Rule = Exclude<LIVRRuleDefinition, readonly unknown[]>;

/**
 * An object with the type of the value rules, the arguments are the same as in list_of:
 * { values: 'string' }, { values: ['required', 'string'] } or { values: [['required', 'string']] }
 */
interface ValuesType extends RuleType {
  // One or more rules: an empty list is a schema error
  params:
    | readonly [Rule, ...Rule[]]
    | readonly [rules: readonly [Rule, ...Rule[]], ...ignored: unknown[]];
  output: Record<
    string,
    this['args'][0] extends infer Rules extends readonly unknown[]
      ? InferRuleType<Rules>
      : InferRuleType<this['args']>
  >;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    values: ValuesType;
  }
}
