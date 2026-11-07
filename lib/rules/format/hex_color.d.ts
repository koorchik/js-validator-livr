// Type inference for 'hex_color' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    hex_color: As<string, readonly []>;
  }
}
