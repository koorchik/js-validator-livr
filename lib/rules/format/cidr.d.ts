// Type inference for 'cidr' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    cidr: As<string, readonly [version?: 'v4' | 'v6', ...ignored: unknown[]]>;
  }
}
