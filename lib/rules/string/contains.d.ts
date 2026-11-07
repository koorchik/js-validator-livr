// Type inference for 'contains' rule
import type { As } from '../../../types/inference';

/** A string, a number is its string form: 1 is "1" */
type StringArg = string | number;

type ContainsParams = readonly [StringArg, ...StringArg[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    contains: As<string, ContainsParams>;
  }
}
