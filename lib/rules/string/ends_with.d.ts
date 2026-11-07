// Type inference for 'ends_with' rule
import type { As } from '../../../types/inference';

/** A string, a number is its string form: 1 is "1" */
type StringArg = string | number;

type EndsWithParams = readonly [StringArg, ...StringArg[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    ends_with: As<string, EndsWithParams>;
  }
}
