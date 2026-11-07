// Type inference for 'remove' rule
import type { RuleType } from '../../../types/inference';

/** A new string: literal types of earlier rules are not kept */
interface RemoveType extends RuleType {
  output: string;
  params: readonly [chars: string, ...ignored: unknown[]];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    remove: RemoveType;
  }
}
