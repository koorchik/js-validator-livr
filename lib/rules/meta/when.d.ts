// Type inference for 'when' rule
import type {
  RuleType,
  InferRuleType,
  MakesPresent,
  LIVRRuleDefinition,
} from '../../../types/inference';

/** A single rule, not a list */
type Rule = Exclude<LIVRRuleDefinition, readonly unknown[]>;

/** Rules of the condition, a branch or a case: an empty list is a schema error, use "any" */
type Rules = Rule | readonly [Rule, ...Rule[]];

/** The cases of the switch form: a referenced value to the rules of the field */
type Cases = { readonly [value: string]: Rules };

/** A union of the types of the cases, each applied to the value like an alias */
type CasesOutput<C, Input> = C extends object
  ? { [K in keyof C]: InferRuleType<C[K], Input> }[keyof C]
  : unknown;

/** Without rules if false, a false condition keeps the value. Arguments after the 4th are ignored */
type ConditionOutput<Args extends readonly unknown[], Input> =
  | InferRuleType<Args[2], Input>
  | (Args['length'] extends 3 ? Input : InferRuleType<Args[3], Input>);

type ConditionPresent<Args extends readonly unknown[], Input> = Args['length'] extends 3
  ? false
  : MakesPresent<Args[2], Input> extends true
    ? MakesPresent<Args[3], Input>
    : false;

/**
 * The condition form, a union of the branches:
 * { when: ['type', { eq: 'company' }, ['required', 'string'], { eq: '' }] }.
 * The switch form, a union of the cases: { when: ['type', { card: rules, bank: rules }] }
 */
interface WhenType extends RuleType {
  params:
    | readonly [reference: string, cases: Cases]
    | readonly [
        reference: string,
        condition: Rules,
        rulesIfTrue: Rules,
        rulesIfFalse?: Rules,
        ...ignored: unknown[],
      ];
  output: this['args']['length'] extends 2
    ? CasesOutput<this['args'][1], this['input']>
    : ConditionOutput<this['args'], this['input']>;
  // The switch form keeps an empty value when no case can be chosen (the referenced value is
  // empty or unknown), even if every case makes the field present
  present: this['args']['length'] extends 2 ? false : ConditionPresent<this['args'], this['input']>;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    when: WhenType;
  }
}
