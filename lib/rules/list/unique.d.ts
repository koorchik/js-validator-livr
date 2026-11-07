// Type inference for 'unique' rule
import type { RuleType } from '../../../types/inference';

/** Only checks the items of a list, so a list type of earlier rules is kept */
interface UniqueType extends RuleType {
  // Key names, a number is its string form: 0 is "0".
  params: readonly (string | number)[];
  output: this['input'] extends readonly unknown[] ? this['input'] : unknown[];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    unique: UniqueType;
  }
}
