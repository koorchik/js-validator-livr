// Type inference for 'iso_datetime' rule: the output is the instant in UTC, a string
import type { As } from '../../../types/inference';

/** Bounds: a datetime with an offset, a date YYYY-MM-DD, "today", "yesterday" or "tomorrow" */
type DatetimeOptions = { readonly min?: string; readonly max?: string };

type IsoDatetimeParams = readonly [options?: DatetimeOptions, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    iso_datetime: As<string, IsoDatetimeParams>;
  }
}
