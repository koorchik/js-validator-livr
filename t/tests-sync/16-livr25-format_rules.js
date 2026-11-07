const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const LIVR = require('../../lib/LIVR');
const AsyncLIVR = require('../../async');

// JS-specific behavior of the LIVR 2.5 format and checksum rules. The rules themselves are
// covered by the LIVR 2.5 test suite

// Runs a script in a new process, where no rule is loaded yet, and returns its JSON output
function runFresh(script) {
  const output = execFileSync(process.execPath, ['-e', script], { cwd: __dirname });
  return JSON.parse(output);
}

function validateField(rule, value) {
  const validator = new LIVR.Validator({ field: rule });
  const output = validator.validate({ field: value });
  return output ? output.field : validator.getErrors().field;
}

test('Wrong arguments of format rules throw when the validator is built', () => {
  const schemas = [
    { hex: 1 },
    { hex: [1, 2] },
    { mongo_id: 'x' },
    { hex_color: true },
    { hostname: 'localhost' },
    { mac: ':' },
    { mac: 32 },
    { mac: '32' },
    { mac: '6 4' },
    { mac: '0x40' },
    { mac: [[48]] },
    { mac: true },
    { e164: 1 },
    { semver: 2 },
    { luhn: 1 },
    { credit_card: 'visa' },
    { iban: 'DE' },
    // Versions are strings "v1"-"v8" and "v4", "v6", case-sensitive: mac takes bit counts
    { uuid: 4 },
    { uuid: '4' },
    { uuid: 'V4' },
    { uuid: 'v0' },
    { uuid: 'v9' },
    { uuid: 'v4 ' },
    { uuid: 'v' },
    { uuid: true },
    { uuid: ['v4', 7] },
    { uuid: [['v4']] },
    { uuid: 'toString' },
    { ip: 4 },
    { ip: '4' },
    { ip: 'V4' },
    { ip: 'v5' },
    { ip: 'ipv4' },
    { ip: [['v4']] },
    { cidr: 6 },
    { cidr: 'v7' },
    { cidr: ['v5', 'v4'] },
    // No "relaxed" (the standard alphabet without padding) in LIVR 2.5
    { base64: 'relaxed' },
    { base64: 'strict' },
    { base64: 'URL' },
    { base64: true },
    { base64: ['relaxed', 'url'] },
    'digest',
    { digest: [] },
    { digest: 'MD5' },
    { digest: 'constructor' },
    { digest: ['md5', 'sha3'] },
    { jwt: 'HS256' },
    { jwt: ['RS256', 'ES256'] },
  ];

  for (const rule of schemas) {
    const validator = new LIVR.Validator({ field: rule });
    assert.throws(() => validator.prepare(), /^Error: LIVR: rule \[\w+\]/, JSON.stringify(rule));
  }

  // Rules with arguments ignore the arguments after them, mac takes the bit count as a string too
  const validator = new LIVR.Validator({
    mac: { mac: '64' },
    macs: { mac: [64, 48] },
    macDecimal: { mac: '64.0' },
    ip: { ip: ['v4', 'v6'] },
    cidr: { cidr: ['v6', 'v4'] },
    base64: { base64: ['url', 'relaxed'] },
  });
  const input = {
    mac: '70-B3-D5-7E-D0-00-12-34',
    macs: '70:B3:D5:7E:D0:00:12:34',
    macDecimal: '70:B3:D5:7E:D0:00:12:34',
    ip: '192.0.2.1',
    cidr: '2001:db8::/32',
    base64: 'SGk',
  };
  assert.deepEqual(validator.validate(input), input);
  assert.equal(
    validator.validate({ mac: '00:1A:2b:3c:4D:5e', ip: '::1', cidr: '10.0.0.0/8', base64: 'a+b=' }),
    false
  );
  assert.deepEqual(validator.getErrors(), {
    mac: 'WRONG_MAC',
    ip: 'WRONG_IP',
    cidr: 'WRONG_CIDR',
    base64: 'WRONG_BASE64',
  });

  // The async validator builds the same rules
  const asyncValidator = new AsyncLIVR.AsyncValidator({ field: { digest: 'sha3' } });
  assert.throws(() => asyncValidator.prepare(), /^Error: LIVR: rule \[digest\]/);
  const asyncBase64 = new AsyncLIVR.AsyncValidator({ field: { base64: 'relaxed' } });
  assert.throws(() => asyncBase64.prepare(), /^Error: LIVR: rule \[base64\]/);

  // hash is digest now: in Perl and in the LIVR test suite a hash is an object
  assert.throws(() => new LIVR.Validator({ field: { hash: 'md5' } }).prepare(), /not registered/);
});

test('Arguments that are an empty list mean no arguments', () => {
  assert.equal(validateField({ hex: [] }, 'ff'), 'ff');
  assert.equal(
    validateField({ uuid: [] }, '00000000-0000-0000-0000-000000000000'),
    '00000000-0000-0000-0000-000000000000'
  );
  assert.equal(validateField({ ip: [] }, '::1'), '::1');
  assert.equal(validateField({ base64: [] }, 'QQ'), 'WRONG_BASE64');
});

test('Format and checksum rules have camelCase names', () => {
  const validator = new LIVR.Validator({
    color: 'hexColor',
    id: 'mongoId',
    card: 'creditCard',
  });

  const input = { color: '#A1b2C3', id: '507F1F77bcf86cd799439011', card: 4111111111111111 };
  assert.deepEqual(validator.validate(input), {
    color: '#A1b2C3',
    id: '507F1F77bcf86cd799439011',
    card: '4111111111111111',
  });

  assert.equal(validator.validate({ color: 'fff', id: '507f', card: '4111111111111112' }), false);
  assert.deepEqual(validator.getErrors(), {
    color: 'WRONG_HEX_COLOR',
    id: 'WRONG_MONGO_ID',
    card: 'WRONG_CREDIT_CARD_NUMBER',
  });
});

test('Format and checksum rules work in the async validator', async () => {
  const validator = new AsyncLIVR.AsyncValidator({
    id: { uuid: 'v4' },
    address: { cidr: 'v6' },
    iban: 'iban',
    host: 'hostname',
    data: { base64: 'url' },
    card: 'credit_card',
  });

  const input = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    address: '2001:db8::/32',
    iban: 'GB82WEST12345698765432',
    host: '123.example',
    data: 'SGk',
    card: '4111111111111111',
  };
  assert.deepEqual(await validator.validate(input), input);
  assert.deepEqual(await validator.validate({ card: 4111111111111111 }), {
    card: '4111111111111111',
  });

  await assert.rejects(
    validator.validate({
      id: 1,
      address: '10.0.0.0/8',
      iban: {},
      host: '192.0.2.1',
      data: true,
      card: false,
    }),
    {
      id: 'WRONG_UUID',
      address: 'WRONG_CIDR',
      iban: 'FORMAT_ERROR',
      host: 'WRONG_HOSTNAME',
      data: 'WRONG_BASE64',
      card: 'WRONG_CREDIT_CARD_NUMBER',
    }
  );
});

test('Booleans fail format and checksum rules with the code of the rule, numbers are strings', () => {
  // [rule, its error code, a number that passes in its string form or undefined]
  const cases = [
    ['uuid', 'WRONG_UUID'],
    [{ uuid: 'v4' }, 'WRONG_UUID'],
    ['ip', 'WRONG_IP'],
    ['cidr', 'WRONG_CIDR'],
    ['hostname', 'WRONG_HOSTNAME'],
    ['base64', 'WRONG_BASE64', 1234],
    [{ base64: 'url' }, 'WRONG_BASE64', 123],
    ['hex', 'WRONG_HEX', 123],
    [{ digest: 'md5' }, 'WRONG_DIGEST'],
    ['mongo_id', 'WRONG_MONGO_ID'],
    ['hex_color', 'WRONG_HEX_COLOR'],
    ['mac', 'WRONG_MAC'],
    ['e164', 'WRONG_E164'],
    ['semver', 'WRONG_SEMVER'],
    ['jwt', 'WRONG_JWT'],
    ['luhn', 'WRONG_CHECKSUM', 79927398713],
    ['credit_card', 'WRONG_CREDIT_CARD_NUMBER', 4111111111111111],
    ['iban', 'WRONG_IBAN'],
  ];

  for (const [rule, errorCode, number] of cases) {
    const name = JSON.stringify(rule);
    assert.equal(validateField(rule, true), errorCode, name);
    assert.equal(validateField(rule, false), errorCode, name);

    // Objects, lists and numbers that are not finite have no string form
    for (const value of [{}, [], ['a'], { a: 1 }, NaN, Infinity]) {
      assert.equal(validateField(rule, value), 'FORMAT_ERROR', `${name} ${String(value)}`);
    }
    if (number !== undefined) assert.equal(validateField(rule, number), String(number), name);
  }

  // The strings "true" and "false" are checked as strings: "true" is a hostname and Base64
  assert.equal(validateField('hostname', 'true'), 'true');
  assert.equal(validateField('base64', 'true'), 'true');
  assert.equal(validateField({ base64: 'url' }, 'false'), 'WRONG_BASE64');
  assert.equal(validateField('hex', 'false'), 'WRONG_HEX');

  // Text rules check the string form of a boolean, digits has its own code
  assert.equal(validateField({ starts_with: 'tr' }, true), 'true');
  assert.equal(validateField({ ends_with: 'se' }, false), 'false');
  assert.equal(validateField({ contains: 'ru' }, true), 'true');
  assert.equal(validateField('digits', true), 'NOT_DIGITS');
});

test('hostname: labels may be all digits, except the last one', () => {
  const long = Array.from({ length: 7 }, (_, i) => `label${i}-${'x'.repeat(20)}`).join('.');
  for (const value of [
    'localhost',
    'example.com',
    '123.example',
    '1.2.3.example',
    'x.y1',
    'a.1b',
    'a.b-1',
    '1-2',
    '0x1',
    `${long}.example.com`,
    'a.'.repeat(126) + 'b',
  ]) {
    assert.equal(validateField('hostname', value), value, value);
  }

  for (const value of [
    '192.0.2.1',
    '123',
    '0',
    'a.123',
    'example.0',
    `${long}.123`,
    'a.'.repeat(126) + '1',
    'a.'.repeat(126) + 'bc',
    'a..b',
    'a.b.',
    '.a',
    '-a.b',
    'a-.b',
    'a.b-',
    'a_b.com',
    `${'a'.repeat(64)}.com`,
  ]) {
    assert.equal(validateField('hostname', value), 'WRONG_HOSTNAME', value);
  }

  // A number is never a hostname: its last label is digits
  for (const value of [123, 1.5, 0, -1]) {
    assert.equal(validateField('hostname', value), 'WRONG_HOSTNAME', String(value));
  }
});

test('uuid: versions are the strings "v1"-"v8", nil and max pass only without versions', () => {
  const v4 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const v7 = '017f22e2-79b0-7cc3-98c4-dc0c0c07398f';
  const nil = '00000000-0000-0000-0000-000000000000';
  const max = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';

  assert.equal(validateField({ uuid: 'v4' }, v4), v4);
  assert.equal(validateField({ uuid: 'v4' }, v7), 'WRONG_UUID');
  assert.equal(validateField({ uuid: ['v4', 'v7'] }, v7), v7);
  assert.equal(validateField({ uuid: ['v4', 'v7'] }, v4), v4);
  for (const value of [nil, max]) {
    assert.equal(validateField('uuid', value), value);
    const allVersions = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'];
    assert.equal(validateField({ uuid: allVersions }, value), 'WRONG_UUID');
  }
});

test('ip and cidr: "v4" or "v6" limits the version, no argument accepts both', () => {
  const cases = [
    ['ip', '192.0.2.1', '2001:db8::1', 'WRONG_IP'],
    ['cidr', '10.0.0.1/8', '2001:db8::/32', 'WRONG_CIDR'],
  ];

  for (const [rule, ipv4, ipv6, errorCode] of cases) {
    assert.equal(validateField(rule, ipv4), ipv4);
    assert.equal(validateField(rule, ipv6), ipv6);
    assert.equal(validateField({ [rule]: [] }, ipv6), ipv6);
    assert.equal(validateField({ [rule]: 'v4' }, ipv4), ipv4);
    assert.equal(validateField({ [rule]: 'v4' }, ipv6), errorCode);
    assert.equal(validateField({ [rule]: 'v6' }, ipv6), ipv6);
    assert.equal(validateField({ [rule]: 'v6' }, ipv4), errorCode);
    assert.equal(validateField({ [rule]: ['v6'] }, ipv6), ipv6);
  }
});

test('digest: hex of the length of one of the algorithms, WRONG_DIGEST', () => {
  const md5 = 'D41D8CD98F00B204E9800998ecf8427e';
  const sha1 = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';

  assert.equal(validateField({ digest: 'md5' }, md5), md5);
  assert.equal(validateField({ digest: 'md5' }, sha1), 'WRONG_DIGEST');
  assert.equal(validateField({ digest: ['md5', 'sha1'] }, sha1), sha1);
  assert.equal(validateField({ digest: 'md5' }, { a: 1 }), 'FORMAT_ERROR');
  assert.equal(validateField({ digest: 'md5' }, md5.slice(1) + 'g'), 'WRONG_DIGEST');
});

test('base64: padding is required without arguments, complete or absent in "url"', () => {
  // No "=": the length modulo 4 is 0, 2 or 3
  for (const value of ['SGk', 'SA', 'SGVsbG8', 'SGVs']) {
    assert.equal(validateField({ base64: 'url' }, value), value, value);
  }

  // Complete padding: the length is a multiple of 4
  for (const value of ['SA==', 'SGk=', 'SGVsbA==']) {
    assert.equal(validateField({ base64: 'url' }, value), value, value);
    assert.equal(validateField('base64', value), value, value);
  }

  // Partial padding, a lone character, "=" not at the end
  for (const value of ['SA=', 'SGVsbA=', 'S', 'SGVsb', 'S===', 'SA=A', '=', '==', 'SA==SA==']) {
    assert.equal(validateField({ base64: 'url' }, value), 'WRONG_BASE64', value);
    assert.equal(validateField('base64', value), 'WRONG_BASE64', value);
  }

  // The standard alphabet needs the padding: no "relaxed" in LIVR 2.5
  for (const value of ['SA', 'SGk', 'SGVsbG8']) {
    assert.equal(validateField('base64', value), 'WRONG_BASE64', value);
  }
  assert.equal(validateField('base64', 'SGVs'), 'SGVs');
  assert.equal(validateField('base64', 'a+/A'), 'a+/A');
  assert.equal(validateField({ base64: 'url' }, 'a-_A'), 'a-_A');
  assert.equal(validateField({ base64: 'url' }, 'a+/A'), 'WRONG_BASE64');
  assert.equal(validateField('base64', 'a-_A'), 'WRONG_BASE64');
});

test('jwt: three base64url segments, none of a length of 1 modulo 4', () => {
  const header = 'eyJhbGciOiJIUzI1NiJ9';
  const payload = 'eyJzdWIiOiIxIn0';
  const signature = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

  for (const value of [
    `${header}.${payload}.${signature}`,
    `${header}.${payload}.`,
    'ab.abc.abcd',
  ]) {
    assert.equal(validateField('jwt', value), value);
  }

  for (const value of [
    `${header}.${payload}`,
    `${header}.${payload}.${signature}.x`,
    `.${payload}.${signature}`,
    `${header}..${signature}`,
    `a.${payload}.${signature}`,
    `${header}.abcde.${signature}`,
    `${header}.${payload}.abcde`,
    `${header}.${payload}.${signature}=`,
    `${header}.${payload}.${signature}\n`,
    'Bearer ' + `${header}.${payload}.${signature}`,
  ]) {
    assert.equal(validateField('jwt', value), 'WRONG_JWT', value);
  }
});

test('Grammars match the whole string with ASCII classes', () => {
  const valid = {
    uuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    ip: '192.0.2.1',
    cidr: '10.0.0.0/8',
    hostname: 'example.com',
    base64: 'SGk=',
    hex: 'ff',
    mongo_id: '507f1f77bcf86cd799439011',
    hex_color: '#fff',
    mac: '00:1a:2b:3c:4d:5e',
    e164: '+14155552671',
    semver: '1.2.3-rc.1+build.5',
    jwt: 'ab.abc.abcd',
    luhn: '79927398713',
    credit_card: '4111111111111111',
    iban: 'GB82WEST12345698765432',
  };

  for (const [rule, value] of Object.entries(valid)) {
    assert.equal(validateField(rule, value), value, rule);

    // A trailing or leading newline, a space, a NUL are not ignored
    for (const wrong of [
      value + '\n',
      '\n' + value,
      value + '\r\n',
      ' ' + value,
      value + ' ',
      value + '\0',
    ]) {
      assert.notEqual(validateField(rule, wrong), wrong, `${rule} ${JSON.stringify(wrong)}`);
    }

    // A line break inside: no multiline matching
    assert.notEqual(validateField(rule, value + '\n' + value), value + '\n' + value, rule);
  }

  assert.equal(validateField({ digest: 'md5' }, 'f'.repeat(32) + '\n'), 'WRONG_DIGEST');

  // Digits and letters of other scripts are not ASCII digits and letters
  const fullwidthOne = '\uff11';
  const arabicIndicOne = '\u0661';
  for (const digit of [fullwidthOne, arabicIndicOne]) {
    assert.equal(validateField('semver', `1.${digit}.3`), 'WRONG_SEMVER');
    assert.equal(validateField('semver', `1.2.3-${digit}`), 'WRONG_SEMVER');
    assert.equal(validateField('e164', `+1415555267${digit}`), 'WRONG_E164');
    assert.equal(validateField('luhn', `7992739871${digit}`), 'WRONG_CHECKSUM');
    assert.equal(validateField('ip', `192.0.2.${digit}`), 'WRONG_IP');
    assert.equal(validateField('cidr', `10.0.0.0/${digit}`), 'WRONG_CIDR');
    assert.equal(validateField('hex', `f${digit}`), 'WRONG_HEX');
  }
  assert.equal(validateField('hostname', 'ex\u00e4mple.com'), 'WRONG_HOSTNAME');
  assert.equal(validateField('hostname', 'example.\u212aom'), 'WRONG_HOSTNAME'); // Kelvin sign
  assert.equal(validateField('iban', 'GB82WEST1234569876543\u0130'), 'WRONG_IBAN');
});

test('LIVR 2.5 rules are loaded on first use, LIVR.rules keeps working as rule builders', () => {
  for (const entry of ['../../lib/LIVR', '../../async']) {
    const result = runFresh(`
      const path = require('node:path');
      const LIVR = require(${JSON.stringify(entry)});
      const Validator = LIVR.Validator || LIVR.AsyncValidator;
      const isLoaded = file => Object.keys(require.cache).some(
        name => name.endsWith(path.join('rules', file))
      );
      const result = { before: [isLoaded('format/uuid.js'), isLoaded('meta/when.js')] };

      // A rule builder from LIVR.rules loads its module
      const ruleBuilder = LIVR.rules.uuid;
      const rule = ruleBuilder('v4', {});
      result.direct = [rule('x', {}, []), isLoaded('format/uuid.js')];
      result.replaced = LIVR.rules.uuid === require('../../lib/rules/format/uuid');
      result.camelCase = Validator.getDefaultRules().hexColor === LIVR.rules.hex_color;

      // The old builder keeps working, validators use the module itself
      result.oldBuilder = ruleBuilder({})('00000000-0000-0000-0000-000000000000', {}, []) ?? null;
      result.registry = Validator.getDefaultRules().uuid === LIVR.rules.uuid;

      // Through a schema, camelCase names too
      const validator = new Validator({ c: 'hexColor', j: 'jwt' });
      validator.prepare();
      result.schema = [isLoaded('format/hex_color.js'), isLoaded('format/jwt.js')];
      result.registryAfterSchema = Validator.getDefaultRules().hexColor === LIVR.rules.hex_color;
      result.other = isLoaded('format/mac.js');
      process.stdout.write(JSON.stringify(result));
    `);

    assert.deepEqual(
      result,
      {
        before: [false, false],
        direct: ['WRONG_UUID', true],
        replaced: true,
        camelCase: true,
        oldBuilder: null,
        registry: true,
        schema: [true, true],
        registryAfterSchema: true,
        other: false,
      },
      entry
    );
  }
});
