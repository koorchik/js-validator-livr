// Type inference for 'base64' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    base64: As<string, readonly [alphabet?: 'url', ...ignored: unknown[]]>;
  }
}
