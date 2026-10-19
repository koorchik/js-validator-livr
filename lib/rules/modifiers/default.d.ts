// Type inference for 'default' rule
import type { RuleType } from '../../../types/inference';

/** Check if T is a union type (has more than one member) */
type IsUnion<T, U = T> = T extends any ? ([U] extends [T] ? false : true) : never;

/** Widen a single literal type to its primitive type, keep unions ('A' as 'A' | 'B') */
type Widen<T> =
  IsUnion<T> extends true
    ? T
    : T extends number
      ? number
      : T extends string
        ? string
        : T extends boolean
          ? boolean
          : T;

/**
 * An empty value becomes the default one, so the field is always present. As the first rule,
 * the type is the widened type of the default value ({ default: 0 } -> number). After other
 * rules, it is their type or the type of the default value
 */
interface DefaultType extends RuleType {
  output: unknown extends this['input']
    ? Widen<this['args'][0]>
    : Exclude<this['input'], null | undefined> | this['args'][0];
  present: true;
}

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    default: DefaultType;
  }
}
