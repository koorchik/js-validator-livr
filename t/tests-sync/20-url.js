const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

const validator = new LIVR.Validator({ url: 'url' });
const isValid = url => validator.validate({ url }) !== false;

function assertValid(urls) {
  for (const url of urls) assert.equal(isValid(url), true, JSON.stringify(url));
}

function assertInvalid(urls) {
  for (const url of urls) assert.equal(isValid(url), false, JSON.stringify(url));
}

test('url rejects invalid hosts quickly', () => {
  const urls = [
    'http://' + 'aaaa.'.repeat(12) + '_',
    'http://' + 'aaaa-'.repeat(12) + '_',
    'http://' + 'aaaa.'.repeat(12) + 'a!',
    'http://user@' + 'aaaa.'.repeat(12) + '_',
    'http://' + 'a@'.repeat(12) + 'aaaa.'.repeat(12) + '_',
  ];

  const start = process.hrtime.bigint();
  assertInvalid(urls);
  const ms = Number(process.hrtime.bigint() - start) / 1e6;

  assert.ok(ms < 50, `${ms.toFixed(1)} ms`);
});

test('url rejects long invalid values quickly', () => {
  const urls = [
    'http://' + 'aaaa.'.repeat(400) + '_',
    'http://' + 'a'.repeat(2000) + '!',
    'http://' + 'a@'.repeat(1000) + '_',
    'http://' + 'a@a.com/'.repeat(250) + ' ',
  ];

  const start = process.hrtime.bigint();
  assertInvalid(urls);
  const ms = Number(process.hrtime.bigint() - start) / 1e6;

  assert.ok(ms < 50, `${ms.toFixed(1)} ms`);
});

test('url rejects a dot after the host', () => {
  assertInvalid([
    'https://example.com.',
    'https://www.google.',
    'https://example.com./path',
    'https://example.com.:8080',
    'http://127.0.0.1./',
  ]);
});

test('url accepts host labels of up to 63 characters', () => {
  assertValid([`https://${'a'.repeat(63)}.com`, `https://example.${'a'.repeat(63)}`]);
  assertInvalid([`https://${'a'.repeat(64)}.com`, `https://example.${'a'.repeat(64)}`]);
});

test('url accepts ports from 0 to 65535', () => {
  assertValid([
    'https://example.com:0',
    'https://example.com:8',
    'https://example.com:80/path',
    'https://example.com:00080',
    'https://example.com:65535',
  ]);
  assertInvalid([
    'https://example.com:65536',
    'https://example.com:99999',
    'https://example.com:123456',
  ]);
});

test('url accepts Unicode hosts, localhost and IPv4 addresses like before', () => {
  assertValid([
    'https://пример.рф',
    'https://münchen.de/straße',
    'http://localhost',
    'http://LOCALHOST:3000/x',
    'http://10.0.0.1/',
    'HTTP://127.0.0.1:3233/?param_1=123&param_2=asd',
    'https://user:pass@example.com',
  ]);
  assertInvalid([
    'http://intranet/',
    'http://0.0.0.0/',
    'http://1.2.3.255/',
    'http://224.0.0.1/',
    'http://256.1.1.1/',
    'https://example.c',
    'https://example.123',
    'https://example..com',
    'http://g_oogle.com',
  ]);
});
