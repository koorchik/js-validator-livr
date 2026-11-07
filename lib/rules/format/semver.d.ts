// Type inference for 'semver' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    semver: As<string, readonly []>;
  }
}
