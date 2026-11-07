// Type inference for 'list_length' rule
import type { RuleType } from '../../../types/inference';

/** A number, also as a string: 5 or "5" */
type NumberArg = number | `${number}`;

/** Only checks the length of a list, so a list type of earlier rules is kept */
interface ListLengthType extends RuleType {
  params:
    | readonly [length: NumberArg]
    | readonly [min: NumberArg, max: NumberArg, ...ignored: unknown[]]
    | readonly [
        options: { readonly min?: NumberArg; readonly max?: NumberArg },
        ...ignored: unknown[],
      ];
  output: this['input'] extends readonly unknown[] ? this['input'] : unknown[];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    list_length: ListLengthType;
  }
}
