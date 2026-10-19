import { createRequire } from 'node:module';
import { defineLoader } from 'vitepress';

// The home page example is validated at build time by the library of the same commit,
// so the output shown on the site is always the real output
const require = createRequire(import.meta.url);

const schema = {
  email: ['required', 'email'],
  age: ['required', 'positive_integer'],
  role: { one_of: ['admin', 'user'] },
};

const input = { email: 'ann@example.com', age: '42', role: 'admin', isAdmin: true };

export interface HeroData {
  version: string;
  schema: string;
  input: string;
  output: string;
}

declare const data: HeroData;
export { data };

// A JavaScript literal with single quotes, inline
function inline(value: unknown): string {
  if (typeof value === 'string') return `'${value}'`;
  if (Array.isArray(value)) return `[${value.map(inline).join(', ')}]`;
  if (value && typeof value === 'object') {
    const fields = Object.entries(value).map(([key, item]) => `${key}: ${inline(item)}`);
    return `{ ${fields.join(', ')} }`;
  }
  return String(value);
}

// One field per line, values aligned
function literal(object: Record<string, unknown>) {
  const width = Math.max(...Object.keys(object).map(key => key.length)) + 1;
  const fields = Object.entries(object).map(
    ([key, value]) => `  ${`${key}:`.padEnd(width)} ${inline(value)}`
  );
  return `{\n${fields.join(',\n')}\n}`;
}

export default defineLoader({
  watch: ['../../../lib/**/*.js'],
  load(): HeroData {
    const LIVR = require('../../../lib/LIVR.js');
    const { version } = require('../../../package.json');
    const validator = new LIVR.Validator(schema);
    const output = validator.validate(input);

    if (!output)
      throw new Error(`Home page example fails: ${JSON.stringify(validator.getErrors())}`);
    return { version, schema: literal(schema), input: literal(input), output: literal(output) };
  },
});
