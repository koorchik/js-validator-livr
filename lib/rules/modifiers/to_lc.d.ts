// Type inference for 'to_lc' rule
import type { RuleType } from '../../../types/inference';

/** Literal types of earlier rules in lower case, otherwise a string */
interface ToLcType extends RuleType {
  output: this['input'] extends string
    ? string extends this['input']
      ? string
      : Lowercase<this['input']>
    : string;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    to_lc: ToLcType;
  }
}
