// Type inference for 'list_of' rule
import type { RuleTypeDef, InferRuleType, LIVRRuleDefinition } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    list_of: RuleTypeDef<
      <R extends LIVRRuleDefinition | readonly LIVRRuleDefinition[]>(rules: R) => Array<InferRuleType<R>>,
      false,
      false
    >;
    listOf: RuleTypeRegistry['list_of'];
  }
}
