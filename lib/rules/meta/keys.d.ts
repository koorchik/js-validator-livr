// Type inference for 'keys' rule
import type { RuleType, LIVRRuleDefinition } from '../../../types/inference';

/** A single rule, not a list */
type Rule = Exclude<LIVRRuleDefinition, readonly unknown[]>;

/**
 * The rules only check the keys and the value is not changed: an object, the object type of
 * earlier rules is kept. The arguments are the same as in list_of:
 * { keys: { one_of: ['uk', 'en'] } }, { keys: ['required', 'string'] } or { keys: [['string']] }
 */
interface KeysType extends RuleType {
  // One or more rules: an empty list is a schema error
  params:
    | readonly [Rule, ...Rule[]]
    | readonly [rules: readonly [Rule, ...Rule[]], ...ignored: unknown[]];
  output: this['input'] extends Record<string, unknown> ? this['input'] : Record<string, unknown>;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    keys: KeysType;
  }
}
