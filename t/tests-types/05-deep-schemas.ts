// t/tests-types/05-deep-schemas.ts
// Deeply nested schemas - verified at compile time via `npx tsc --noEmit`.
// Types of fields are computed only when they are used, so the depth is limited by TypeScript
// ("Type instantiation is excessively deep"), as before the rule types: an engine that computes
// nested objects with their parent stops at 6 levels of nested_object and 4 levels of or

import type { InferFromSchema } from '../../types';

/** A list of Depth items, for the depth of the schemas below */
type Levels<Depth extends number, L extends unknown[] = []> = L['length'] extends Depth
  ? L
  : Levels<Depth, [...L, unknown]>;

type Leaf = { leaf: ['required', 'string'] };

type NestedObjects<L extends unknown[]> = L extends [unknown, ...infer Rest]
  ? { x: ['required', { nested_object: NestedObjects<Rest> }] }
  : Leaf;

type ListsOfObjects<L extends unknown[]> = L extends [unknown, ...infer Rest]
  ? { x: ['required', { list_of_objects: ListsOfObjects<Rest> }] }
  : Leaf;

type Ors<L extends unknown[]> = L extends [unknown, ...infer Rest]
  ? { x: ['required', { or: [{ nested_object: Ors<Rest> }, { nested_object: Ors<Rest> }] }] }
  : Leaf;

type ListsOf<L extends unknown[]> = L extends [unknown, ...infer Rest]
  ? { x: ['required', { list_of: { nested_object: ListsOf<Rest> } }] }
  : Leaf;

declare const nestedObjects: InferFromSchema<NestedObjects<Levels<20>>>;
declare const listsOfObjects: InferFromSchema<ListsOfObjects<Levels<20>>>;
declare const ors: InferFromSchema<Ors<Levels<12>>>;
declare const listsOf: InferFromSchema<ListsOf<Levels<16>>>;

export const leaves: string[] = [
  nestedObjects.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.leaf,
  listsOfObjects.x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0]
    .x[0].x[0].x[0].x[0].leaf,
  ors.x.x.x.x.x.x.x.x.x.x.x.x.leaf,
  listsOf.x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].x[0].leaf,
];
