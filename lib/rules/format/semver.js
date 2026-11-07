const util = require('../../util');

// The regular expression of semver.org 2.0.0 (its groups capture the parts), with [0-9] for \d as
// the LIVR grammars use ASCII classes only
const SEMVER_RE =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function semver() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [semver] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_SEMVER');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!SEMVER_RE.test(value)) return 'WRONG_SEMVER';
    outputArr.push(value);
  };
}

module.exports = semver;
