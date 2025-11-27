// Type inference for 'or' rule
import type { RuleTypeDef, InferRuleType, LIVRRuleDefinition } from '../../../types/inference';

/** Helper type to build union from array of rule definitions */
type BuildOrUnion<Rules extends readonly LIVRRuleDefinition[]> =
  Rules extends readonly [infer First extends LIVRRuleDefinition, ...infer Rest extends readonly LIVRRuleDefinition[]]
    ? InferRuleType<First> | BuildOrUnion<Rest>
    : never;

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    or: RuleTypeDef<
      <R extends readonly LIVRRuleDefinition[]>(rules: R) => BuildOrUnion<R>,
      false,
      false
    >;
  }
}
