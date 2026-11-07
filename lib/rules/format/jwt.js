const util = require('../../util');

// The structure of a JWS compact serialization: header.payload.signature in base64url without
// padding. The signature is empty in an unsecured JWT (alg "none"). The segments are not decoded:
// the rule tells a JWT from other strings, the application still verifies the token
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;

function jwt() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [jwt] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_JWT');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!JWT_RE.test(value) || !hasBase64UrlLengths(value)) return 'WRONG_JWT';
    outputArr.push(value);
  };
}

// No base64url segment has a length of 1 modulo 4: such a length cannot come from bytes.
// The token matches JWT_RE, so it has exactly two dots
function hasBase64UrlLengths(token) {
  const firstDot = token.indexOf('.');
  const secondDot = token.indexOf('.', firstDot + 1);

  return (
    firstDot % 4 !== 1 &&
    (secondDot - firstDot - 1) % 4 !== 1 &&
    (token.length - secondDot - 1) % 4 !== 1
  );
}

module.exports = jwt;
