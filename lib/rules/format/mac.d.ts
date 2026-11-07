// Type inference for 'mac' rule
import type { As } from '../../../types/inference';

type MacParams = readonly [bits?: 48 | 64 | '48' | '64', ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    mac: As<string, MacParams>;
  }
}
