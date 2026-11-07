// Type inference for 'any' rule
import type { As } from '../../../types/inference';

/** Any value passes and stays unchanged: unknown, or the type of earlier rules */
declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    any: As<unknown, readonly []>;
  }
}
