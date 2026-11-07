// Type inference for 'iso_time' rule
import type { As } from '../../../types/inference';

/** Bounds: times HH:MM[:SS[.fraction]], min after max is a range over midnight */
type TimeOptions = { readonly min?: string; readonly max?: string };

type IsoTimeParams = readonly [options?: TimeOptions, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    iso_time: As<string, IsoTimeParams>;
  }
}
