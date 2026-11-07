// Type inference for 'starts_with' rule
import type { As } from '../../../types/inference';

/** A string, a number is its string form: 1 is "1" */
type StringArg = string | number;

type StartsWithParams = readonly [StringArg, ...StringArg[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    starts_with: As<string, StartsWithParams>;
  }
}
