// Type inference for 'to_uc' rule
import type { RuleType } from '../../../types/inference';

/** Literal types of earlier rules in upper case, otherwise a string */
interface ToUcType extends RuleType {
  // Arguments are ignored, as in LIVR 2.0
  params: readonly unknown[];
  output: this['input'] extends string
    ? string extends this['input']
      ? string
      : Uppercase<this['input']>
    : string;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    to_uc: ToUcType;
  }
}
