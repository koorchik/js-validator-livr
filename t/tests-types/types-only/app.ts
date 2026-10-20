// t/tests-types/types-only/app.ts
// A program that imports only 'livr/types/inference', like a rule package or a package of shared
// types: the built-in rules have their types too. Verified via `npx tsc --noEmit -p t/tests-types/types-only`

import type { As, InferFromSchema, RuleName } from 'livr/types/inference';
import type { Expect, Equal } from '../utils';

declare module 'livr/types/inference' {
  interface RuleTypes {
    shared_uuid: As<string>;
  }
}

const schema = {
  id: ['required', 'shared_uuid'],
  name: ['required', 'string', { max_length: 20 }],
  age: 'positive_integer',
  address: { nested_object: { city: ['required', 'string'] } },
} as const;

type _types = [
  Expect<
    Equal<
      InferFromSchema<typeof schema>,
      { id: string; name: string; age?: number; address?: { city: string } }
    >
  >,
  Expect<
    Equal<
      Extract<'required' | 'nestedObject' | 'sharedUuid', RuleName>,
      'required' | 'nestedObject' | 'sharedUuid'
    >
  >,
];
