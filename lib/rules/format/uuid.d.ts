// Type inference for 'uuid' rule
import type { As } from '../../../types/inference';

type UuidVersion = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    uuid: As<string, readonly UuidVersion[]>;
  }
}
