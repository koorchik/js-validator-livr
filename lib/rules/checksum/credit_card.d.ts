// Type inference for 'credit_card' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    credit_card: As<string, readonly []>;
  }
}
