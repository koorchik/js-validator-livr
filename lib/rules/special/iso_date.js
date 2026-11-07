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

// Two ASCII digits at index as a number, -1 when they are not digits
function num2(str, index) {
  const high = str.charCodeAt(index) - 48;
  const low = str.charCodeAt(index + 1) - 48;
  return high >= 0 && high <= 9 && low >= 0 && low <= 9 ? high * 10 + low : -1;
}

// A date YYYY-MM-DD as a number in the order of dates (year * 512 + month * 32 + day), or -1 when
// it is not a valid calendar date. Parsed by hand: faster than a regular expression
function dateKey(str) {
  if (str.length !== 10 || str.charCodeAt(4) !== 45 || str.charCodeAt(7) !== 45) return -1;

  const century = num2(str, 0);
  const yearOfCentury = num2(str, 2);
  const month = num2(str, 5);
  const day = num2(str, 8);
  if ((century | yearOfCentury) < 0 || month < 1 || month > 12 || day < 1) return -1;

  const year = century * 100 + yearOfCentury;
  if (day > 28) {
    const maxDays = month === 2 ? (isLeapYear(year) ? 29 : 28) : DAYS_IN_MONTH[month - 1];
    if (day > maxDays) return -1;
  }

  return year * 512 + month * 32 + day;
}

// The dateKey() of a day number (days since 1970-01-01, UTC), "civil_from_days" by Howard Hinnant
function dayToKey(days) {
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
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);

  return year * 512 + month * 32 + day;
}

// The dateKey() of yesterday, the current date and tomorrow for the day number in cachedDay. All
// rules share them: they change once a day, and a validator created for every validation gets
// them without the calendar arithmetic
let cachedDay = NaN;
const cachedKeys = [0, 0, 0];

function relativeKey(today, days) {
  if (today !== cachedDay) {
    cachedKeys[0] = dayToKey(today - 1);
    cachedKeys[1] = dayToKey(today);
    cachedKeys[2] = dayToKey(today + 1);
    cachedDay = today;
  }

  return cachedKeys[days + 1];
}

// A bound: the dateKey() of a date, or { days } relative to the current date
function parseBound(bound, name) {
  if (typeof bound === 'string') {
    if (hasOwn.call(RELATIVE_DAYS, bound)) return { days: RELATIVE_DAYS[bound] };

    const key = dateKey(bound);
    if (key >= 0) return key;
  }

  // "current" of livr-extra-rules is "today" in LIVR 2.5
  const hint = bound === 'current' ? ', use "today" instead of "current"' : '';
  throw new Error(
    `LIVR: "iso_date" takes a date YYYY-MM-DD, "today", "yesterday" or "tomorrow" as "${name}", got ${JSON.stringify(bound)}${hint}`
  );
}

//   iso_date(): YYYY-MM-DD, as in LIVR 2.0
//   iso_date({ min, max }): date bounds. Arguments after the object are ignored
// Without arguments the rule gets only ruleBuilders. Named parameters, not a rest parameter:
// building the 2.0 form costs no more than in LIVR 2.0
function iso_date(options) {
  // { iso_date: null } is the plain iso_date too: LIVR 2.0 ignored the arguments of iso_date
  if (arguments.length === 1 || (arguments.length === 2 && options === null)) return isoDate;

  // LIVR 2.0 ignored any argument, so { iso_date: "today" } never checked what it says
  if (!util.isObject(options)) {
    throw new Error(
      `LIVR: "iso_date" takes no arguments or an object with "min" and "max" first, got ${describe(options)}`
    );
  }

  for (const key in options) {
    if (key !== 'min' && key !== 'max') {
      const hint = key === 'format' ? ', use "iso_datetime" for datetimes' : '';
      throw new Error(`LIVR: "iso_date" got an unknown option "${key}"${hint}`);
    }
  }

  const min = options.min === undefined ? undefined : parseBound(options.min, 'min');
  const max = options.max === undefined ? undefined : parseBound(options.max, 'max');
  if (min === undefined && max === undefined) return isoDate;

  // Fixed bounds are keys already, relative ones are computed from the clock
  const minKey = typeof min === 'number' ? min : -1;
  const maxKey = typeof max === 'number' ? max : Infinity;
  const minDays = typeof min === 'object' ? min.days : null;
  const maxDays = typeof max === 'object' ? max.days : null;

  // No value could pass: both bounds are dates or both are relative. A date and a relative bound
  // depend on the day ({ min: "2026-12-01", max: "today" } accepts nothing before December)
  if (
    min !== undefined &&
    max !== undefined &&
    (minDays === null ? minKey > maxKey : maxDays !== null && minDays > maxDays)
  ) {
    throw new Error(
      `LIVR: "iso_date" got "min" later than "max": ${JSON.stringify(options.min)}, ${JSON.stringify(options.max)}`
    );
  }

  if (minDays === null && maxDays === null) {
    return value => {
      if (typeof value !== 'string') return checkNotString(value);
      if (value === '') return;

      const key = dateKey(value);
      if (key < 0) return 'WRONG_DATE';
      if (key < minKey) return 'DATE_TOO_EARLY';
      if (key > maxKey) return 'DATE_TOO_LATE';
    };
  }

  return value => {
    if (typeof value !== 'string') return checkNotString(value);
    if (value === '') return;

    const key = dateKey(value);
    if (key < 0) return 'WRONG_DATE';

    // The system clock, read for every value (so fake timers in tests work): the current date
    // in UTC, never in the local time zone
    const today = Math.floor(Date.now() / DAY_MS);
    if (key < (minDays === null ? minKey : relativeKey(today, minDays))) return 'DATE_TOO_EARLY';
    if (key > (maxDays === null ? maxKey : relativeKey(today, maxDays))) return 'DATE_TOO_LATE';
  };
}

function describe(value) {
  return Array.isArray(value) ? 'a list' : JSON.stringify(value);
}

// A value that is not a string: empty, a number or a boolean (never a date), or not primitive
function checkNotString(value) {
  if (value === undefined || value === null) return;
  return util.isPrimitiveValue(value) ? 'WRONG_DATE' : 'FORMAT_ERROR';
}

// The LIVR 2.0 form: YYYY-MM-DD, a valid calendar date, the value is not changed
function isoDate(value) {
  if (typeof value !== 'string') return checkNotString(value);
  if (value === '') return;
  if (dateKey(value) < 0) return 'WRONG_DATE';
}

module.exports = iso_date;
