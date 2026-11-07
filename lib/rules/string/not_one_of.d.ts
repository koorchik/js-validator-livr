// Type inference for 'not_one_of' rule
import type { As } from '../../../types/inference';

type Primitive = string | number | boolean;

type NotOneOfParams = readonly [Primitive, ...Primitive[]];

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    // Only checks a primitive value, so the type of earlier rules is kept
    not_one_of: As<string | number | boolean, NotOneOfParams>;
  }
}
