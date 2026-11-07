// Type inference for 'one_of' rule
import type { RuleType } from '../../../types/inference';

type Primitive = string | number | boolean;

/**
 * { one_of: ['a', 'b'] } or { one_of: [['a', 'b']] } -> 'a' | 'b':
 * the output is the allowed value itself
 */
interface OneOfType extends RuleType {
  params: readonly Primitive[] | readonly [values: readonly Primitive[], ...ignored: unknown[]];
  output: this['args'][0] extends infer Values extends readonly unknown[]
    ? Values[number]
    : this['args'][number];
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    one_of: OneOfType;
  }
}
