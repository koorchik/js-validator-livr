// Type inference for 'iban' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    iban: As<string, readonly []>;
  }
}
