// Type inference for 'or' rule
import type {
  RuleType,
  InferRuleType,
  MakesPresent,
  LIVRRuleDefinition,
} from '../../../types/inference';

/** A union of the types of the rule sets, each applied to the value like an alias */
type OrOutput<RuleSets, Input> = RuleSets extends unknown ? InferRuleType<RuleSets, Input> : never;

/** The field is present when every rule set makes it present */
type OrPresent<RuleSets, Input> = [RuleSets] extends [never]
  ? false
  : false extends (RuleSets extends unknown ? MakesPresent<RuleSets, Input> : never)
    ? false
    : true;

/** { or: ['string', ['required', 'integer']] } -> string | number */
interface OrType extends RuleType {
  params: readonly LIVRRuleDefinition[];
  output: OrOutput<this['args'][number], this['input']>;
  present: OrPresent<this['args'][number], this['input']>;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    or: OrType;
  }
}
