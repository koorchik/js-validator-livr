// Type inference for 'trim' rule
import type { RuleType } from '../../../types/inference';

/** A new string: literal types of earlier rules are not kept */
interface TrimType extends RuleType {
  output: string;
  // Arguments are ignored, as in LIVR 2.0
  params: readonly unknown[];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    trim: TrimType;
  }
}
