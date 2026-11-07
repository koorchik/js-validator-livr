const util = require('../../util');

// RFC 9562: the version digit (the first of the third group) is 1-8, the variant digit
// (the first of the fourth group) is 8, 9, a or b
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// The nil and the max UUID have no version and variant, they pass only without arguments
const NIL_OR_MAX_RE =
  /^(?:00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

// A rest parameter instead of slicing `arguments`, which is slow
function uuid(...versions) {
  versions.pop(); // pop ruleBuilders

  if (versions.length === 0) {
    return (value, params, outputArr) => {
      if (typeof value !== 'string') {
        // A number is checked in its string form, a boolean fails
        if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_UUID');
        value = String(value);
      } else if (value === '') {
        return;
      }

      if (!UUID_RE.test(value) && !NIL_OR_MAX_RE.test(value)) return 'WRONG_UUID';
      outputArr.push(value);
    };
  }

  // Allowed version digits as bits: "v4" is 1 << 4. Versions are strings "v1"-"v8", like in ip
  // and cidr: 4, "4" or "V4" is a schema error. Character codes, not a lookup table: a rule built
  // for every validation is cheaper
  let allowedVersionBits = 0;
  for (const version of versions) {
    const isVersion = typeof version === 'string' && version.length === 2;
    const digit = isVersion && version.charCodeAt(0) === 118 ? version.charCodeAt(1) - 48 : 0; // "v"
    if (!(digit >= 1 && digit <= 8)) {
      throw new Error(`LIVR: rule [uuid] takes versions "v1"-"v8", got ${JSON.stringify(version)}`);
    }
    allowedVersionBits |= 1 << digit;
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_UUID');
      value = String(value);
    } else if (value === '') {
      return;
    }

    // The version digit is at index 14: "xxxxxxxx-xxxx-Vxxx-..."
    const isAllowed =
      UUID_RE.test(value) && (allowedVersionBits & (1 << (value.charCodeAt(14) - 48))) !== 0;
    if (!isAllowed) return 'WRONG_UUID';
    outputArr.push(value);
  };
}

module.exports = uuid;
