// Type inference for 'not_empty' rule
import type { RuleType } from '../../../types/inference';

/** Only checks the value, so the type is kept. A string as the first rule */
interface NotEmptyType extends RuleType {
  output: unknown extends this['input'] ? string : this['input'];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    not_empty: NotEmptyType;
  }
}
