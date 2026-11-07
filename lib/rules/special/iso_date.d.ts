// Type inference for 'iso_date' rule
import type { As } from '../../../types/inference';

/** Bounds: a date YYYY-MM-DD, "today", "yesterday" or "tomorrow" (in UTC) */
type DateOptions = { readonly min?: string; readonly max?: string };

// null is the plain iso_date: LIVR 2.0 ignored the arguments of iso_date
type IsoDateParams = readonly [options?: DateOptions, ...ignored: unknown[]] | readonly [null];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    iso_date: As<string, IsoDateParams>;
  }
}
