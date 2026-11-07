const util = require('../../util');

// 10^(18 - length): the nanoseconds of the last fraction digit of HH:MM:SS.fraction
const FRACTION_UNITS = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000];

// Two ASCII digits at index as a number, -1 when they are not digits
function num2(str, index) {
  const high = str.charCodeAt(index) - 48;
  const low = str.charCodeAt(index + 1) - 48;
  return high >= 0 && high <= 9 && low >= 0 && low <= 9 ? high * 10 + low : -1;
}

// HH:MM, HH:MM:SS or HH:MM:SS.fraction (1-9 digits), without an offset, as <input type="time">
// sends it. Returns nanoseconds since midnight, -1 for a wrong time. Exact in plain numbers
// (below 86400 * 10^9 < 2^53), so "09:00" equals "09:00:00.0" and nine digits are not rounded
function parseTime(str) {
  const length = str.length;
  if (length !== 5 && length !== 8 && (length < 10 || length > 18)) return -1;

  const hours = num2(str, 0);
  const minutes = num2(str, 3);
  if (str.charCodeAt(2) !== 58 || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return -1;
  }

  let seconds = hours * 3600 + minutes * 60;
  if (length === 5) return seconds * 1e9;

  const secondsOfMinute = num2(str, 6);
  if (str.charCodeAt(5) !== 58 || secondsOfMinute < 0 || secondsOfMinute > 59) return -1;

  seconds += secondsOfMinute;
  if (length === 8) return seconds * 1e9;

  if (str.charCodeAt(8) !== 46) return -1;

  let fraction = 0;
  for (let i = 9; i < length; i++) {
    const digit = str.charCodeAt(i) - 48;
    if (!(digit >= 0 && digit <= 9)) return -1;
    fraction = fraction * 10 + digit;
  }

  return seconds * 1e9 + fraction * FRACTION_UNITS[18 - length];
}

function parseBound(options, key) {
  const bound = options[key];
  if (bound === undefined) return;

  const time = typeof bound === 'string' ? parseTime(bound) : -1;
  if (time < 0) {
    throw new Error(`LIVR: "iso_time" got a wrong time in "${key}": ${JSON.stringify(bound)}`);
  }

  return time;
}

// "iso_time", or { iso_time: { min, max } }. With min greater than max the range goes over
// midnight: { min: "22:00", max: "06:00" } accepts 23:00 and 05:00.
// Without arguments the rule gets only ruleBuilders. A named parameter, not a rest parameter:
// building the rule is cheaper
function iso_time(options) {
  if (arguments.length === 1) return checkTime;

  // Arguments after the object are ignored
  if (!util.isObject(options)) {
    throw new Error('LIVR: "iso_time" takes no arguments or an object with "min" and "max" first');
  }

  for (const key in options) {
    if (key !== 'min' && key !== 'max') {
      throw new Error(`LIVR: "iso_time" got an unknown option "${key}"`);
    }
  }

  const min = parseBound(options, 'min');
  const max = parseBound(options, 'max');

  if (min === undefined && max === undefined) return checkTime;

  if (min === undefined || max === undefined || min <= max) {
    const minTime = min === undefined ? -1 : min;
    const maxTime = max === undefined ? Infinity : max;

    return value => {
      if (typeof value !== 'string') return checkNotString(value);
      if (value === '') return;

      const time = parseTime(value);
      if (time < 0) return 'WRONG_TIME';
      if (time < minTime) return 'TIME_TOO_EARLY';
      if (time > maxTime) return 'TIME_TOO_LATE';
    };
  }

  // Over midnight: the gap between max and min is rejected with the error of the nearer
  // bound, so 07:00 is after the end (06:00) and 21:00 before the start (22:00). Exactly in
  // the middle it is TIME_TOO_EARLY
  return value => {
    if (typeof value !== 'string') return checkNotString(value);
    if (value === '') return;

    const time = parseTime(value);
    if (time < 0) return 'WRONG_TIME';
    if (time >= min || time <= max) return;
    return time - max < min - time ? 'TIME_TOO_LATE' : 'TIME_TOO_EARLY';
  };
}

// A value that is not a string: empty, a number or a boolean (never a time), or not primitive
function checkNotString(value) {
  if (value === undefined || value === null) return;
  return util.isPrimitiveValue(value) ? 'WRONG_TIME' : 'FORMAT_ERROR';
}

// Only a string can be a time, so the value stays as it is
function checkTime(value) {
  if (typeof value !== 'string') return checkNotString(value);
  if (value === '') return;
  if (parseTime(value) < 0) return 'WRONG_TIME';
}

module.exports = iso_time;
