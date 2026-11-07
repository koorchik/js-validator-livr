// Type inference for 'ip' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    ip: As<string, readonly [version?: 'v4' | 'v6', ...ignored: unknown[]]>;
  }
}
