const util = require('../../util');

// RFC 4648. Groups of 4 characters, the padding "=" or "==" only at the end. The unused bits of
// the last character are not checked
const BASE64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// The URL-safe alphabet, the padding is optional: either complete or absent, a lone character in
// the last group is never valid. No option for the standard alphabet without padding ("relaxed"
// of livr-extra-rules)
const BASE64_URL_RE = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}(?:==)?|[A-Za-z0-9_-]{3}=?)?$/;

function base64(...args) {
  args.pop(); // pop ruleBuilders

  let re;
  if (args.length === 0) {
    re = BASE64_RE;
  } else if (args[0] === 'url') {
    // Arguments after "url" are ignored
    re = BASE64_URL_RE;
  } else {
    throw new Error('LIVR: rule [base64] takes no arguments or "url"');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_BASE64');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!re.test(value)) return 'WRONG_BASE64';
    outputArr.push(value);
  };
}

module.exports = base64;
