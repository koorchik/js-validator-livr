const util = require('../../util');

// Hex pairs separated by ":" or by "-": the back reference keeps the first separator.
// 48 bits are six pairs (MAC-48, EUI-48), 64 bits are eight pairs (EUI-64: LoRaWAN DevEUI,
// IEEE 802.15.4, IPv6 interface identifiers)
const MAC_RE = {
  48: /^[0-9a-fA-F]{2}([:-])[0-9a-fA-F]{2}(?:\1[0-9a-fA-F]{2}){4}$/,
  64: /^[0-9a-fA-F]{2}([:-])[0-9a-fA-F]{2}(?:\1[0-9a-fA-F]{2}){6}$/,
};

function mac(...args) {
  args.pop(); // ruleBuilders

  // The bit count, also as a string in the grammar of "decimal" ("64"). Arguments after it are
  // ignored
  let bits = args.length === 0 ? 48 : args[0];
  if (typeof bits === 'string' && /^-?[0-9]+(?:\.[0-9]+)?$/.test(bits)) bits = +bits;
  if (bits !== 48 && bits !== 64) {
    throw new Error('LIVR: rule [mac] takes no arguments, 48 or 64');
  }

  const re = MAC_RE[bits];

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_MAC');
      value = String(value);
    } else if (value === '') {
      return;
    }

    if (!re.test(value)) return 'WRONG_MAC';
    outputArr.push(value);
  };
}

module.exports = mac;
