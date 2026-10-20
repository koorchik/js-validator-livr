// t/tests-types/06-validator-api.ts
// The API of Validator ('livr') and AsyncValidator ('livr/async') - verified at compile time
// via `npx tsc --noEmit`. Rule types are global: rules here have names of their own

import type { As, InferFromSchema } from '../../types/inference';
import type { Expect, Equal } from './utils';
import LIVR = require('../../lib/LIVR');
import LIVRAsync = require('../../async');

declare module '../../types/inference' {
  interface RuleTypes {
    api_unique_username: As<string>;
    api_alias: As<string>;
  }
}

const schema = {
  username: ['required', 'string', 'api_unique_username'],
  age: 'positive_integer',
  address: { nested_object: { city: ['required', 'string'] } },
} as const;

type User = InferFromSchema<typeof schema>;
type ExpectedUser = { username: string; age?: number; address?: { city: string } };

// ============================================================================
// AsyncValidator
// ============================================================================

const asyncValidator = new LIVRAsync.AsyncValidator<User>(schema);
new LIVRAsync.AsyncValidator(schema, { autoTrim: true });
new LIVRAsync.AsyncValidator(schema, true);
new LIVRAsync.AsyncValidator<User>(schema).prepare();

async function validateAsync(input: unknown): Promise<string> {
  try {
    const user = await asyncValidator.validate(input);
    type _user = Expect<Equal<typeof user, ExpectedUser>>;
    return user.username;
  } catch (errors) {
    return String(errors);
  }
}

// Rules that return promises
LIVRAsync.AsyncValidator.registerDefaultRules({
  api_unique_username: () => async (value: unknown) => (value === 'admin' ? 'TAKEN' : undefined),
});
asyncValidator.registerRules({ api_unique_username: () => () => undefined }).prepare();
asyncValidator.registerAliasedRule({ name: 'api_alias', rules: ['required', 'string'] });
LIVRAsync.AsyncValidator.registerAliasedDefaultRule({ name: 'api_alias', rules: 'required' });
LIVRAsync.AsyncValidator.defaultAutoTrim(false);

const asyncFieldRule = asyncValidator.getFieldRule('username');
const asyncFieldResult: unknown = asyncFieldRule('admin', {}, []);

type _async = [
  Expect<Equal<ReturnType<typeof asyncValidator.validate>, Promise<ExpectedUser>>>,
  Expect<Equal<Awaited<ReturnType<typeof validateAsync>>, string>>,
  Expect<Equal<keyof typeof LIVRAsync, 'AsyncValidator' | 'rules' | 'util'>>,
  // The types of 'livr' are also in the namespace of 'livr/async'
  Expect<Equal<LIVRAsync.InferFromSchema<typeof schema>, ExpectedUser>>,
  Expect<Equal<LIVRAsync.RuleTypes, LIVR.RuleTypes>>,
];

// No getErrors(): validate() rejects with the errors
// @ts-expect-error
asyncValidator.getErrors();

// The same rules and helpers as in 'livr'
const nestedObject = LIVRAsync.rules.nested_object;
const isEmpty: boolean = LIVRAsync.util.isNoValue('');
const defaultRules = Object.keys(LIVRAsync.AsyncValidator.getDefaultRules());
const asyncRules = asyncValidator.getRules();

// ============================================================================
// Validator
// ============================================================================

const validator = new LIVR.Validator<User>(schema, { autoTrim: true });
new LIVR.Validator(schema, true);

const output = validator.validate({});
const errors = validator.getErrors();
const localRules = validator
  .registerRules({ api_unique_username: () => () => undefined })
  .getRules();

type _sync = [
  Expect<Equal<typeof output, ExpectedUser | false>>,
  Expect<Equal<keyof typeof LIVR, 'Validator' | 'ValidatorError' | 'rules' | 'util'>>,
];

// Helpers of the rules
declare const value: unknown;
if (LIVR.util.isNoValue(value)) {
  type _noValue = Expect<Equal<typeof value, undefined | null | ''>>;
}
if (LIVR.util.isThenable(value)) {
  type _thenable = Expect<Equal<typeof value, PromiseLike<unknown>>>;
}
const helpers: Array<boolean | string | unknown> = [
  LIVR.util.isPrimitiveValue(value),
  LIVR.util.looksLikeNumber('1'),
  LIVR.util.isObject(value),
  LIVR.util.isEmptyObject({}),
  LIVR.util.escapeRegExp('a.b'),
  LIVR.util.getFieldValue({ a: 1 }, 'a'),
  LIVR.util.camelize('max_length'),
];

export {
  asyncFieldResult,
  nestedObject,
  isEmpty,
  defaultRules,
  asyncRules,
  errors,
  localRules,
  helpers,
};
