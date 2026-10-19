// Type inference for 'iso_date' rule
import type { As } from '../../../types/inference';

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    iso_date: As<string>;
  }
}
