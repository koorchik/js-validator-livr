const util = require('../../util');

// A BSON ObjectId: 12 bytes in hex
const MONGO_ID_RE = /^[0-9a-fA-F]{24}$/;

function mongo_id() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: rule [mongo_id] takes no arguments');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_MONGO_ID');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!MONGO_ID_RE.test(value)) return 'WRONG_MONGO_ID';
    outputArr.push(value);
  };
}

module.exports = mongo_id;
