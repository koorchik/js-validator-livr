const util = require('../../util');

// Four numbers 0-255 without leading zeros: some systems read "010" as octal
const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;

function isHexDigit(code) {
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 70) || // A-F
    (code >= 97 && code <= 102) // a-f
  );
}

function isHexGroup(str, start, end) {
  if (end - start < 1 || end - start > 4) return false;
  for (let i = start; i < end; i++) {
    if (!isHexDigit(str.charCodeAt(i))) return false;
  }
  return true;
}

// Number of 16-bit groups in str[start, end): hex groups separated by ":", the last one may be
// an IPv4 address (two groups) when it is at the end of the address. -1 for a wrong group
function countGroups(str, start, end, isAddressEnd) {
  if (start === end) return 0;

  let count = 0;
  let groupStart = start;
  for (let i = start; i < end; i++) {
    if (str.charCodeAt(i) !== 58) continue; // ":"
    if (!isHexGroup(str, groupStart, i)) return -1;
    count++;
    groupStart = i + 1;
  }

  if (isHexGroup(str, groupStart, end)) return count + 1;
  if (isAddressEnd && IPV4_RE.test(str.slice(groupStart, end))) return count + 2;
  return -1;
}

// RFC 4291, section 2.2: eight groups, or fewer with one "::" for one or more groups of zeros
function isIPv6(str) {
  const gapIndex = str.indexOf('::');

  if (gapIndex === -1) return countGroups(str, 0, str.length, true) === 8;

  // A second "::" (":::" too) is ambiguous
  if (str.indexOf('::', gapIndex + 1) !== -1) return false;

  const before = countGroups(str, 0, gapIndex, false);
  const after = countGroups(str, gapIndex + 2, str.length, true);
  return before !== -1 && after !== -1 && before + after <= 7;
}

// A rest parameter instead of slicing `arguments`, which is slow
function ip(...args) {
  args.pop(); // pop ruleBuilders

  // "v4" or "v6" as a number, 0 for both. Versions are strings, like in uuid: 4, "4" or "V4" is a
  // schema error. Arguments after the version are ignored
  const version = args.length === 0 ? 0 : args[0] === 'v4' ? 4 : args[0] === 'v6' ? 6 : -1;
  if (version < 0) {
    throw new Error('LIVR: rule [ip] takes no arguments, "v4" or "v6"');
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') {
      // A number is checked in its string form, a boolean fails
      if (!Number.isFinite(value)) return util.formatRuleError(value, 'WRONG_IP');
      value = String(value);
    } else if (value === '') {
      return;
    }

    const isValid = (version !== 6 && IPV4_RE.test(value)) || (version !== 4 && isIPv6(value));
    if (!isValid) return 'WRONG_IP';
    outputArr.push(value);
  };
}

module.exports = ip;
