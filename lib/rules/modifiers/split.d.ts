// Type inference for 'split' rule
import type { RuleType } from '../../../types/inference';

/**
 * A string, a number or a boolean (in its string form) becomes a list of strings,
 * a list of earlier rules is kept
 */
interface SplitType extends RuleType {
  // A number is its string form: 1 is "1"
  params: readonly [separator: string | number, ...ignored: unknown[]];
  output: this['input'] extends readonly unknown[] ? this['input'] : string[];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    split: SplitType;
  }
}
