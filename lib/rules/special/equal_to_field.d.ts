// Type inference for 'equal_to_field' rule
import type { RuleType } from '../../../types/inference';

/** Only checks the value, so the type is kept. A string as the first rule */
interface EqualToFieldType extends RuleType {
  output: unknown extends this['input'] ? string : this['input'];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    equal_to_field: EqualToFieldType;
  }
}
