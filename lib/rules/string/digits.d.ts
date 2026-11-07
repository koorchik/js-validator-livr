// Type inference for 'digits' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    digits: As<string, readonly []>;
  }
}
