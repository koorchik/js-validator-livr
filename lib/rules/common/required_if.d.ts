// Type inference for 'required_if' rule
import type { As } from '../../../types/inference';

type Primitive = string | number | boolean;

/** References to a value or a non-empty list of values */
type Conditions = {
  readonly [reference: string]: Primitive | readonly [Primitive, ...Primitive[]];
};

type RequiredIfParams = readonly [conditions: Conditions, ...ignored: unknown[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // Only checks the value, so the type is kept. The field is not always present
    required_if: As<unknown, RequiredIfParams>;
  }
}
