// A rule package with types in RuleTypes

import type { As, RuleType } from 'livr/types/inference';

/** { id_of: 'user' } -> `user_${string}` */
interface IdOfType extends RuleType {
  output: this['args'][0] extends string ? `${this['args'][0]}_${string}` : string;
}

declare module 'livr/types/inference' {
  interface RuleTypes {
    uuid: As<string>;
    mongo_id: As<string>;
    id_of: IdOfType;
  }
}

type RuleFactory = (
  ...args: Array<any>
) => (value: any, params: any, outputArr: Array<any>) => string | undefined;

declare const idRules: Record<string, RuleFactory>;
export = idRules;
