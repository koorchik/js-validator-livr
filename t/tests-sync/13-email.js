const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

// Cases around quoted local parts: one regular expression covers the former separate checks
// for a second "@" and for "_" after "@"
test('email accepts and rejects addresses with quoted local parts like before', () => {
  const validator = new LIVR.Validator({ email: 'email' });
  const isValid = email => validator.validate({ email }) !== false;

  for (const email of ['"john doe"@example.com', '"a_b"@example.com', 'a@[192.168.0.1]']) {
    assert.equal(isValid(email), true, email);
  }

  for (const email of [
    '"a@b"@example.com',
    '"a_b@c"@example.com',
    'a@b_c.com',
    'a@b@c.com',
    '"a b"@example.com',
    '"a\nb"@example.com',
  ]) {
    assert.equal(isValid(email), false, JSON.stringify(email));
  }
});
