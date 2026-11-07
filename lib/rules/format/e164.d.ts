// Type inference for 'e164' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    e164: As<string, readonly []>;
  }
}
