// Type inference for 'mongo_id' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // No arguments: any argument is a schema error, null too
    mongo_id: As<string, readonly []>;
  }
}
