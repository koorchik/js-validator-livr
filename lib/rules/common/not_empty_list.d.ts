// Type inference for 'not_empty_list' rule
import type { RuleType } from '../../../types/inference';

/** A missing list is an error, so the field is always present. A list type of earlier rules is kept */
interface NotEmptyListType extends RuleType {
  output: this['input'] extends readonly unknown[] ? this['input'] : unknown[];
  present: true;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    not_empty_list: NotEmptyListType;
  }
}
