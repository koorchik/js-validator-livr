// Type inference for 'digest' rule
import type { As } from '../../../types/inference';

type Algorithm = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512';

type DigestParams = readonly [Algorithm, ...Algorithm[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    digest: As<string, DigestParams>;
  }
}
