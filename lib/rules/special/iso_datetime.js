const util = require('../../util');

const hasOwn = Object.prototype.hasOwnProperty;

const DAY_MS = 86400000;

// Bounds relative to the current UTC date
const RELATIVE_DAYS = { yesterday: -1, today: 0, tomorrow: 1 };

// Days in each month (index 0 = January)
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  return month === 2 ? (isLeapYear(year) ? 29 : 28) : DAYS_IN_MONTH[month - 1];
}

// Instants are compared as keys, numbers in the order of time without Date objects and the
// days-from-civil arithmetic: (year * 512 + month * 32 + day) * DAY_MS + milliseconds of the day,
// all in UTC. Exact: the keys of the years 0000-9999 are below 2^49
function dayKey(year, month, day) {
  return (year * 512 + month * 32 + day) * DAY_MS;
}

// The UTC fields of the last datetime that parseDatetime() read
let utcYear = 0;
let utcMonth = 0;
let utcDay = 0;
let utcMinutes = 0; // of the day
let utcSeconds = 0;
let utcMs = 0;

// YYYY-MM-DD "T" HH ":" MM [ ":" SS [ "." 1*9DIGIT ] ] ( "Z" / ( "+" / "-" ) HH ":" MM ).
// Sets the UTC fields of the instant, cut to milliseconds, and returns 1, or 2 when the string is
// already in the form of the output (YYYY-MM-DDTHH:MM:SS.sssZ), -1 when it is not such a datetime.
// Parsed by hand: a regular expression with groups is several times slower. Small integers only:
// a key above 2^31 would be a heap number for every call
function parseDatetime(str) {
  const length = str.length;
  if (
    length < 17 ||
    str.charCodeAt(4) !== 45 ||
    str.charCodeAt(7) !== 45 ||
    str.charCodeAt(10) !== 84 ||
    str.charCodeAt(13) !== 58
  ) {
    return -1;
  }

  // Digits without a helper function: TurboFan does not inline a dozen calls of it. A digit is
  // 0-9, so (digit | 9 - digit) is negative for any other character
  const y0 = str.charCodeAt(0) - 48;
  const y1 = str.charCodeAt(1) - 48;
  const y2 = str.charCodeAt(2) - 48;
  const y3 = str.charCodeAt(3) - 48;
  const mo0 = str.charCodeAt(5) - 48;
  const mo1 = str.charCodeAt(6) - 48;
  const d0 = str.charCodeAt(8) - 48;
  const d1 = str.charCodeAt(9) - 48;
  const h0 = str.charCodeAt(11) - 48;
  const h1 = str.charCodeAt(12) - 48;
  const mi0 = str.charCodeAt(14) - 48;
  const mi1 = str.charCodeAt(15) - 48;
  let invalid = y0 | (9 - y0) | y1 | (9 - y1) | y2 | (9 - y2) | y3 | (9 - y3);
  invalid |= mo0 | (9 - mo0) | mo1 | (9 - mo1) | d0 | (9 - d0) | d1 | (9 - d1);
  invalid |= h0 | (9 - h0) | h1 | (9 - h1) | mi0 | (9 - mi0) | mi1 | (9 - mi1);
  if (invalid < 0) return -1;

  let year = y0 * 1000 + y1 * 100 + y2 * 10 + y3;
  let month = mo0 * 10 + mo1;
  let day = d0 * 10 + d1;
  const hours = h0 * 10 + h1;
  const minutes = mi0 * 10 + mi1;
  if (month < 1 || month > 12 || day < 1 || hours > 23 || minutes > 59) return -1;
  if (day > 28 && day > daysInMonth(year, month)) return -1;

  let seconds = 0;
  let ms = 0;
  let index = 16;
  let char = str.charCodeAt(16);

  if (char === 58) {
    if (length < 20) return -1;

    const s0 = str.charCodeAt(17) - 48;
    const s1 = str.charCodeAt(18) - 48;
    if ((s0 | (9 - s0) | s1 | (9 - s1)) < 0) return -1;
    seconds = s0 * 10 + s1;
    if (seconds > 59) return -1;

    index = 19;
    char = str.charCodeAt(19);

    if (char === 46) {
      // 1-9 digits, the first three are milliseconds, the others are cut off. The character
      // after them must be the offset, so a tenth digit is wrong
      index = 20;
      let digits = 0;
      while (index < 29) {
        char = str.charCodeAt(index);
        if (!(char >= 48 && char <= 57)) break;
        if (index < 23) {
          ms = ms * 10 + char - 48;
          digits++;
        }
        index++;
      }
      if (index === 20) return -1;
      if (index === 29) char = str.charCodeAt(29);
      if (digits === 1) ms *= 100;
      else if (digits === 2) ms *= 10;
    }
  }

  let offset = 0; // minutes east of UTC
  if (char === 90) {
    if (index + 1 !== length) return -1;
  } else if (char === 43 || char === 45) {
    if (index + 6 !== length || str.charCodeAt(index + 3) !== 58) return -1;

    const oh0 = str.charCodeAt(index + 1) - 48;
    const oh1 = str.charCodeAt(index + 2) - 48;
    const om0 = str.charCodeAt(index + 4) - 48;
    const om1 = str.charCodeAt(index + 5) - 48;
    if ((oh0 | (9 - oh0) | oh1 | (9 - oh1) | om0 | (9 - om0) | om1 | (9 - om1)) < 0) return -1;

    const offsetHours = oh0 * 10 + oh1;
    const offsetMinutes = om0 * 10 + om1;
    if (offsetHours > 23 || offsetMinutes > 59) return -1;

    offset = offsetHours * 60 + offsetMinutes;
    if (char === 45) offset = -offset;
  } else {
    return -1;
  }

  // An offset moves the time by less than a day, so at most to the next or the previous day
  let minutesOfDay = hours * 60 + minutes - offset;
  if (minutesOfDay < 0) {
    minutesOfDay += 1440;
    if (--day === 0) {
      if (--month === 0) {
        month = 12;
        year--;
      }
      day = daysInMonth(year, month);
    }
  } else if (minutesOfDay >= 1440) {
    minutesOfDay -= 1440;
    if (++day > 28 && day > daysInMonth(year, month)) {
      day = 1;
      if (++month === 13) {
        month = 1;
        year++;
      }
    }
  }

  utcYear = year;
  utcMonth = month;
  utcDay = day;
  utcMinutes = minutesOfDay;
  utcSeconds = seconds;
  utcMs = ms;

  // "Z" at 23 only after seconds and three fraction digits
  return index === 23 && char === 90 ? 2 : 1;
}

// The key of the last parsed datetime
function lastKey() {
  return dayKey(utcYear, utcMonth, utcDay) + (utcMinutes * 60 + utcSeconds) * 1000 + utcMs;
}

// The fields of the last parsed datetime as YYYY-MM-DDTHH:MM:SS.sssZ. One flat string from the
// character codes: faster than toISOString() or concatenation
function formatUtc() {
  const year = utcYear;
  const hours = (utcMinutes / 60) | 0;
  const minutes = utcMinutes - hours * 60;
  const ms = utcMs;
  const centiseconds = (ms / 10) | 0;

  return String.fromCharCode(
    48 + ((year / 1000) | 0),
    48 + (((year / 100) | 0) % 10),
    48 + (((year / 10) | 0) % 10),
    48 + (year % 10),
    45,
    48 + ((utcMonth / 10) | 0),
    48 + (utcMonth % 10),
    45,
    48 + ((utcDay / 10) | 0),
    48 + (utcDay % 10),
    84,
    48 + ((hours / 10) | 0),
    48 + (hours % 10),
    58,
    48 + ((minutes / 10) | 0),
    48 + (minutes % 10),
    58,
    48 + ((utcSeconds / 10) | 0),
    48 + (utcSeconds % 10),
    46,
    48 + ((centiseconds / 10) | 0),
    48 + (centiseconds % 10),
    48 + (ms - centiseconds * 10),
    90
  );
}

// The key of the start of the day of a day number (days since 1970-01-01, UTC),
// "civil_from_days" by Howard Hinnant
function dayNumberKey(days) {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153); // March is 0
  const day = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1;
  const month = shiftedMonth < 10 ? shiftedMonth + 3 : shiftedMonth - 9;

  return dayKey(yearOfEra + era * 400 + (month <= 2 ? 1 : 0), month, day);
}

// The keys of the start of yesterday, the current date and tomorrow for the day number in
// cachedDay. All rules share them: they change once a day, and a validator created for every
// validation gets them without the calendar arithmetic
let cachedDay = NaN;
const cachedKeys = [0, 0, 0];

function relativeKey(today, days) {
  if (today !== cachedDay) {
    cachedKeys[0] = dayNumberKey(today - 1);
    cachedKeys[1] = dayNumberKey(today);
    cachedKeys[2] = dayNumberKey(today + 1);
    cachedDay = today;
  }

  return cachedKeys[days + 1];
}

// A bound: the key of an instant, or { days } relative to the current date. A date, given or
// relative, is the start of the UTC day as "min" and its end as "max"
function parseBound(bound, name) {
  const isMax = name === 'max';

  if (typeof bound === 'string') {
    if (hasOwn.call(RELATIVE_DAYS, bound)) return { days: RELATIVE_DAYS[bound] };

    if (bound.length === 10) {
      if (parseDatetime(bound + 'T00:00Z') > 0) return isMax ? lastKey() + DAY_MS - 1 : lastKey();
    } else if (parseDatetime(bound) > 0) {
      // An instant of any year: it is only compared with values
      return lastKey();
    }
  }

  // "current" of livr-extra-rules is "today" in LIVR 2.5
  const hint = bound === 'current' ? ', use "today" instead of "current"' : '';
  throw new Error(
    `LIVR: "iso_datetime" takes a datetime with an offset, a date YYYY-MM-DD, "today", "yesterday" or "tomorrow" as "${name}", got ${JSON.stringify(bound)}${hint}`
  );
}

// The output: the instant in UTC with three fraction digits. A value in this form stays as it is
function convert(value, outputArr) {
  const result = parseDatetime(value);
  if (result === 2) return;
  if (result < 0 || utcYear < 0 || utcYear > 9999) return 'WRONG_DATETIME';
  outputArr.push(formatUtc());
}

function checkNotString(value) {
  if (value === undefined || value === null) return;
  return util.isPrimitiveValue(value) ? 'WRONG_DATETIME' : 'FORMAT_ERROR';
}

function isoDatetime(value, params, outputArr) {
  if (typeof value !== 'string') return checkNotString(value);
  if (value === '') return;
  return convert(value, outputArr);
}

//   iso_datetime(): a datetime with an offset, the output is the instant in UTC
//   iso_datetime({ min, max }): with bounds. Arguments after the object are ignored
// Named parameters, not a rest parameter: building the rule is cheaper
function iso_datetime(options) {
  // Without arguments the rule gets only ruleBuilders
  if (arguments.length === 1) return isoDatetime;

  if (!util.isObject(options)) {
    throw new Error(
      `LIVR: "iso_datetime" takes no arguments or an object with "min" and "max" first, got ${Array.isArray(options) ? 'a list' : JSON.stringify(options)}`
    );
  }

  for (const key in options) {
    if (key !== 'min' && key !== 'max') {
      throw new Error(`LIVR: "iso_datetime" got an unknown option "${key}"`);
    }
  }

  const min = options.min === undefined ? undefined : parseBound(options.min, 'min');
  const max = options.max === undefined ? undefined : parseBound(options.max, 'max');
  if (min === undefined && max === undefined) return isoDatetime;

  // Fixed bounds are keys already, relative ones are computed from the clock
  const minKey = typeof min === 'number' ? min : -Infinity;
  const maxKey = typeof max === 'number' ? max : Infinity;
  const minDays = typeof min === 'object' ? min.days : null;
  const maxDays = typeof max === 'object' ? max.days : null;
  const isRelative = minDays !== null || maxDays !== null;

  // No value could pass: both bounds are fixed or both are relative. A fixed and a relative bound
  // depend on the day
  if (
    min !== undefined &&
    max !== undefined &&
    (minDays === null ? minKey > maxKey : maxDays !== null && minDays > maxDays)
  ) {
    throw new Error(
      `LIVR: "iso_datetime" got "min" later than "max": ${JSON.stringify(options.min)}, ${JSON.stringify(options.max)}`
    );
  }

  return (value, params, outputArr) => {
    if (typeof value !== 'string') return checkNotString(value);
    if (value === '') return;

    // The format first: a value outside the years 0000-9999 in UTC is wrong, whatever the bounds
    const result = parseDatetime(value);
    if (result < 0 || utcYear < 0 || utcYear > 9999) return 'WRONG_DATETIME';
    const key = dayKey(utcYear, utcMonth, utcDay) + (utcMinutes * 60 + utcSeconds) * 1000 + utcMs;

    if (!isRelative) {
      if (key < minKey) return 'DATETIME_TOO_EARLY';
      if (key > maxKey) return 'DATETIME_TOO_LATE';
    } else {
      // The system clock, read for every value (so fake timers in tests work): the current date
      // in UTC, never in the local time zone
      const today = Math.floor(Date.now() / DAY_MS);
      if (key < (minDays === null ? minKey : relativeKey(today, minDays))) {
        return 'DATETIME_TOO_EARLY';
      }
      if (key > (maxDays === null ? maxKey : relativeKey(today, maxDays) + DAY_MS - 1)) {
        return 'DATETIME_TOO_LATE';
      }
    }

    if (result !== 2) outputArr.push(formatUtc());
  };
}

module.exports = iso_datetime;
