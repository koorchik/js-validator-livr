// Type inference for 'hex' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    hex: As<string, readonly []>;
  }
}
