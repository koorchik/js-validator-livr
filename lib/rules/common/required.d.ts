// Type inference for 'required' rule
import type { RuleType } from '../../../types/inference';

/** The value is present: not missing, null or an empty string. The type is kept */
interface RequiredType extends RuleType {
  // Arguments are ignored, as in LIVR 2.0
  params: readonly unknown[];
  output: Exclude<this['input'], null | undefined>;
  present: true;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    required: RequiredType;
  }
}
