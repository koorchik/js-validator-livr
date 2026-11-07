const util = require('../../util');

// #RGB, #RGBA, #RRGGBB or #RRGGBBAA
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function hex_color() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [hex_color] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_HEX_COLOR');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!HEX_COLOR_RE.test(value)) return 'WRONG_HEX_COLOR';
    outputArr.push(value);
  };
}

module.exports = hex_color;
