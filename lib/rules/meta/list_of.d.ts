// Type inference for 'list_of' rule
import type { RuleType, InferRuleType } from '../../../types/inference';

/**
 * An array of the type of the item rules:
 * { list_of: 'string' }, { list_of: ['required', 'string'] } or { list_of: [['required', 'string']] }
 */
interface ListOfType extends RuleType {
  output: Array<
    this['args'][0] extends infer Rules extends readonly unknown[]
      ? InferRuleType<Rules>
      : InferRuleType<this['args']>
  >;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    list_of: ListOfType;
  }
}
