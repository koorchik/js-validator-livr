// Type inference for 'eq' rule
import type { RuleType } from '../../../types/inference';

/** { eq: 'a' } -> 'a': the output is the allowed value itself */
interface EqType extends RuleType {
  output: this['args'][0];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    eq: EqType;
  }
}
