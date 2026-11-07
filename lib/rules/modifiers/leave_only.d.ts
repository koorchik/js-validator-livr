// Type inference for 'leave_only' rule
import type { RuleType } from '../../../types/inference';

/** A new string: literal types of earlier rules are not kept */
interface LeaveOnlyType extends RuleType {
  output: string;
  params: readonly [chars: string, ...ignored: unknown[]];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    leave_only: LeaveOnlyType;
  }
}
