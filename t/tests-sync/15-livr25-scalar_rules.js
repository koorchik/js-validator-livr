// LIVR 2.5 scalar, list and presence rules: what the JSON test suite does not reach.
// The system clock, schema errors and camelCase names
const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../lib/LIVR');

const NOT_FUTURE = { iso_date: { max: 'today' } };

// Fixes the system clock (Date.now() and new Date()) for the rest of the test with the fake
// timers of node:test. Rules read Date.now() when they check a value, so a test needs nothing else
function fixClock(t, time) {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(time) });
}

test('Relative bounds read the system clock, so fake timers fix it', t => {
  fixClock(t, '2026-10-29T21:30:00Z');
  const validator = new LIVR.Validator({ date: NOT_FUTURE });

  assert.deepEqual(validator.validate({ date: '2026-10-29' }), { date: '2026-10-29' });
  assert.equal(validator.validate({ date: '2026-10-30' }), false);
  assert.deepEqual(validator.getErrors(), { date: 'DATE_TOO_LATE' });
});

test('A stub of Date.now() fixes the clock too', () => {
  const validator = new LIVR.Validator({ date: NOT_FUTURE }).prepare();
  const realNow = Date.now;

  try {
    Date.now = () => Date.UTC(2026, 9, 29, 12);
    assert.equal(validator.validate({ date: '2026-10-30' }), false);

    Date.now = () => Date.UTC(2026, 9, 30, 12);
    assert.deepEqual(validator.validate({ date: '2026-10-30' }), { date: '2026-10-30' });
  } finally {
    Date.now = realNow;
  }
});

test('"today", "yesterday" and "tomorrow" are days in UTC, not in the local time zone', t => {
  // 2026-10-30 in Kyiv, still 2026-10-29 in UTC
  fixClock(t, '2026-10-30T01:30:00+02:00');
  const validator = new LIVR.Validator({
    date: { iso_date: { min: 'yesterday', max: 'tomorrow' } },
  });

  assert.deepEqual(validator.validate({ date: '2026-10-28' }), { date: '2026-10-28' });
  assert.deepEqual(validator.validate({ date: '2026-10-30' }), { date: '2026-10-30' });
  assert.equal(validator.validate({ date: '2026-10-27' }), false);
  assert.deepEqual(validator.getErrors(), { date: 'DATE_TOO_EARLY' });
  assert.equal(validator.validate({ date: '2026-10-31' }), false);
  assert.deepEqual(validator.getErrors(), { date: 'DATE_TOO_LATE' });
});

test('"current" of livr-extra-rules is a schema error that suggests "today"', () => {
  for (const rule of ['iso_date', 'iso_datetime']) {
    for (const bound of ['min', 'max']) {
      const validator = new LIVR.Validator({ field: { [rule]: { [bound]: 'current' } } });
      assert.throws(() => validator.prepare(), /^Error: LIVR: .*use "today" instead of "current"/);
    }
  }

  // Other wrong bounds do not get the hint
  const validator = new LIVR.Validator({ field: { iso_date: { max: 'now' } } });
  assert.throws(
    () => validator.prepare(),
    error => !/current/.test(error.message.split('got')[1])
  );
});

test('Relative bounds follow the clock over days, months and years', t => {
  fixClock(t, '2024-02-28T12:00:00Z');
  const validator = new LIVR.Validator({
    date: { iso_date: { min: 'yesterday', max: 'tomorrow' } },
    at: { iso_datetime: { min: 'yesterday', max: 'tomorrow' } },
  });

  const check = (date, at, errors) => {
    const result = validator.validate({ date, at });
    assert.deepEqual(result || validator.getErrors(), errors || { date, at });
  };

  check('2024-02-27', '2024-02-27T00:00:00.000Z');
  check('2024-02-29', '2024-02-29T23:59:59.999Z');
  check('2024-02-26', '2024-03-01T00:00:00.000Z', {
    date: 'DATE_TOO_EARLY',
    at: 'DATETIME_TOO_LATE',
  });

  t.mock.timers.setTime(Date.parse('2024-12-31T23:59:59.999Z'));
  check('2025-01-01', '2024-12-30T00:00:00.000Z');
  check('2025-01-02', '2024-12-29T23:59:59.999Z', {
    date: 'DATE_TOO_LATE',
    at: 'DATETIME_TOO_EARLY',
  });

  t.mock.timers.setTime(Date.UTC(2023, 0, 1));
  check('2022-12-31', '2023-01-02T23:59:59.999Z');
  check('2022-12-30', '2023-01-03T00:00:00.000Z', {
    date: 'DATE_TOO_EARLY',
    at: 'DATETIME_TOO_LATE',
  });
});

test('The clock is read when a value is checked, not when the validator is prepared', t => {
  fixClock(t, '2026-10-29T12:00:00Z');
  const validator = new LIVR.Validator({
    date: NOT_FUTURE,
    at: { iso_datetime: { max: 'today' } },
  }).prepare();

  assert.equal(validator.validate({ date: '2026-10-30', at: '2026-10-30T00:00Z' }), false);
  assert.deepEqual(validator.getErrors(), { date: 'DATE_TOO_LATE', at: 'DATETIME_TOO_LATE' });

  t.mock.timers.setTime(Date.parse('2026-10-30T00:00:00Z'));
  assert.deepEqual(validator.validate({ date: '2026-10-30', at: '2026-10-30T00:00Z' }), {
    date: '2026-10-30',
    at: '2026-10-30T00:00:00.000Z',
  });
});

test('Rules without a relative bound do not read the clock', () => {
  const validator = new LIVR.Validator({
    date: { iso_date: { min: '2020-01-01' } },
    at: { iso_datetime: { max: '2030-01-01' } },
    relative: NOT_FUTURE,
  }).prepare();
  const realNow = Date.now;
  let calls = 0;

  try {
    Date.now = () => {
      calls++;
      return realNow();
    };

    const input = { date: '2020-01-01', at: '2029-12-31T23:59:59.999Z', relative: '' };
    assert.deepEqual(validator.validate(input), input);
    assert.equal(calls, 0);

    // An empty value or a wrong date does not read it either
    assert.equal(validator.validate({ relative: '2020-02-30' }), false);
    assert.equal(calls, 0);
    assert.deepEqual(validator.validate({ relative: '2020-01-01' }), { relative: '2020-01-01' });
    assert.equal(calls, 1);
  } finally {
    Date.now = realNow;
  }
});

test('Nested validators read the same clock: meta rules, aliases, default aliases', t => {
  fixClock(t, '2026-10-29T12:00:00Z');
  LIVR.Validator.registerAliasedDefaultRule({
    name: 'livr25_not_future_default',
    rules: { nested_object: { date: NOT_FUTURE } },
  });

  const validator = new LIVR.Validator({
    nested: { nested_object: { date: NOT_FUTURE } },
    list: { list_of: NOT_FUTURE },
    objects: { list_of_objects: { date: NOT_FUTURE } },
    either: { or: [NOT_FUTURE, 'integer'] },
    aliased: 'livr25_not_future',
    defaultAliased: 'livr25_not_future_default',
    at: { list_of: { iso_datetime: { max: 'today' } } },
    switch: { when: ['type', { a: NOT_FUTURE }] },
    dict: { values: NOT_FUTURE },
  });
  validator.registerAliasedRule({ name: 'livr25_not_future', rules: NOT_FUTURE });

  const tomorrow = '2026-10-30';
  assert.equal(
    validator.validate({
      nested: { date: tomorrow },
      list: [tomorrow],
      objects: [{ date: tomorrow }],
      either: tomorrow,
      aliased: tomorrow,
      defaultAliased: { date: tomorrow },
      at: ['2026-10-30T00:00Z'],
      type: 'a',
      switch: tomorrow,
      dict: { d: tomorrow },
    }),
    false
  );
  assert.deepEqual(validator.getErrors(), {
    nested: { date: 'DATE_TOO_LATE' },
    list: ['DATE_TOO_LATE'],
    objects: [{ date: 'DATE_TOO_LATE' }],
    either: 'NOT_INTEGER',
    aliased: 'DATE_TOO_LATE',
    defaultAliased: { date: 'DATE_TOO_LATE' },
    at: ['DATETIME_TOO_LATE'],
    switch: 'DATE_TOO_LATE',
    dict: { d: 'DATE_TOO_LATE' },
  });

  const today = '2026-10-29';
  const input = {
    nested: { date: today },
    list: [today],
    objects: [{ date: today }],
    either: today,
    aliased: today,
    defaultAliased: { date: today },
  };
  assert.deepEqual(validator.validate(input), input);
});

test('There is no "now" option: the bounds follow the system clock', () => {
  const validator = new LIVR.Validator({ date: NOT_FUTURE }, { now: '2100-01-01T00:00:00Z' });
  const today = new Date().toISOString().slice(0, 10);

  assert.equal(validator.validate({ date: '2050-01-01' }), false);
  assert.deepEqual(validator.getErrors(), { date: 'DATE_TOO_LATE' });
  assert.deepEqual(validator.validate({ date: today }), { date: today });
});

test('iso_date: the LIVR 2.0 forms are unchanged, an empty options object is the same', () => {
  const forms = [
    'iso_date',
    'isoDate',
    { iso_date: [] },
    { iso_date: {} },
    { iso_date: [{}] },
    // Arguments after the options object are ignored
    { iso_date: [{}, 'x'] },
    { iso_date: [{}, {}] },
  ];

  for (const rules of forms) {
    const validator = new LIVR.Validator({ date: rules });
    const name = JSON.stringify(rules);

    assert.deepEqual(validator.validate({ date: '2024-02-29' }), { date: '2024-02-29' }, name);
    assert.deepEqual(validator.validate({ date: '0000-01-01' }), { date: '0000-01-01' }, name);
    assert.deepEqual(validator.validate({ date: '' }), { date: '' }, name);
    assert.deepEqual(validator.validate({ date: null }), { date: null }, name);
    assert.deepEqual(validator.validate({}), {}, name);

    const wrongDates = [
      '2023-02-29',
      '2100-02-29',
      '2024-04-31',
      '2024-13-01',
      '2024-00-10',
      '2024-01-00',
      '2024-01-32',
      '2024-01-01T00:00:00Z',
      '2024-1-01',
      '2024/01/01',
      '２０２４-01-01',
      '2024-01-01\n',
      20240101,
      true,
    ];
    for (const date of wrongDates) {
      assert.equal(validator.validate({ date }), false, `${name} ${date}`);
      assert.deepEqual(validator.getErrors(), { date: 'WRONG_DATE' });
    }

    for (const date of [['2024-01-01'], {}, NaN]) {
      assert.equal(validator.validate({ date }), false, name);
      assert.deepEqual(validator.getErrors(), { date: 'FORMAT_ERROR' });
    }
  }
});

test('iso_date: the first argument, if any, is an options object, LIVR 2.0 ignored it', () => {
  const wrongRules = [
    { iso_date: 'x' },
    { iso_date: 'today' },
    { iso_date: 'datetime' },
    { iso_date: true },
    { iso_date: 5 },
    { iso_date: [null, { min: 'today' }] },
    { iso_date: [['x']] },
    { iso_date: [1, 2] },
    { iso_date: ['x', { min: 'today' }] },
    { iso_date: ['tomorrow', 'today'] },
  ];

  for (const rules of wrongRules) {
    const validator = new LIVR.Validator({ date: rules });
    assert.throws(
      () => validator.prepare(),
      /^Error: LIVR: "iso_date" takes no arguments or an object with "min" and "max" first/,
      JSON.stringify(rules)
    );
  }
});

test('iso_date and iso_datetime: min later than max is a schema error when both are fixed or both relative', t => {
  const wrongRules = [
    { iso_date: { min: '2026-02-01', max: '2026-01-31' } },
    { iso_date: { min: 'tomorrow', max: 'yesterday' } },
    { iso_date: { min: 'today', max: 'yesterday' } },
    { iso_datetime: { min: '2026-02-01', max: '2026-01-31' } },
    { iso_datetime: { min: '2026-01-31T12:00Z', max: '2026-01-31T11:59:59.999Z' } },
    { iso_datetime: { min: '2026-01-31T12:00+02:00', max: '2026-01-31T09:59Z' } },
    { iso_datetime: { min: '2026-02-01', max: '2026-01-31T23:59:59.999Z' } },
    { iso_datetime: { min: 'tomorrow', max: 'today' } },
  ];

  for (const rules of wrongRules) {
    const validator = new LIVR.Validator({ field: rules });
    assert.throws(
      () => validator.prepare(),
      /^Error: LIVR: "iso_date(time)?" got "min" later than "max"/,
      JSON.stringify(rules)
    );
  }

  // Equal bounds, and a fixed bound with a relative one, which depends on the day
  fixClock(t, '2026-10-29T12:00:00Z');
  const validator = new LIVR.Validator({
    day: { iso_date: { min: '2026-10-29', max: '2026-10-29' } },
    today: { iso_date: { min: 'today', max: 'today' } },
    later: { iso_date: { min: '2026-12-01', max: 'today' } },
    instant: { iso_datetime: { min: '2026-10-29T10:00Z', max: '2026-10-29T12:00+02:00' } },
    datetimeDay: { iso_datetime: { min: '2026-10-29T23:59:59.999Z', max: '2026-10-29' } },
    datetimeLater: { iso_datetime: { min: 'tomorrow', max: '2026-01-01' } },
  });

  const input = {
    day: '2026-10-29',
    today: '2026-10-29',
    instant: '2026-10-29T10:00Z',
    datetimeDay: '2026-10-29T23:59:59.999Z',
  };
  assert.deepEqual(validator.validate(input), {
    ...input,
    instant: '2026-10-29T10:00:00.000Z',
  });

  assert.equal(
    validator.validate({ later: '2026-10-29', datetimeLater: '2026-10-30T00:00Z' }),
    false
  );
  assert.deepEqual(validator.getErrors(), {
    later: 'DATE_TOO_EARLY',
    datetimeLater: 'DATETIME_TOO_LATE',
  });
});

test('iso_date, iso_datetime and iso_time: a number or a boolean is a wrong value in every form', t => {
  fixClock(t, '2026-10-29T12:00:00Z');
  const forms = {
    iso_date: ['iso_date', { iso_date: { min: '2020-01-01' } }, { iso_date: { max: 'today' } }],
    iso_datetime: [
      'iso_datetime',
      { iso_datetime: { min: '2020-01-01' } },
      { iso_datetime: { max: 'today' } },
    ],
    iso_time: [
      'iso_time',
      { iso_time: { min: '09:00' } },
      { iso_time: { min: '22:00', max: '06:00' } },
    ],
  };
  const codes = { iso_date: 'WRONG_DATE', iso_datetime: 'WRONG_DATETIME', iso_time: 'WRONG_TIME' };

  for (const [rule, rulesList] of Object.entries(forms)) {
    for (const rules of rulesList) {
      const validator = new LIVR.Validator({ field: rules });
      const name = JSON.stringify(rules);

      for (const field of [true, false, 0, 20260101, 1.5]) {
        assert.equal(validator.validate({ field }), false, `${name} ${field}`);
        assert.deepEqual(validator.getErrors(), { field: codes[rule] }, `${name} ${field}`);
      }
      for (const field of [{}, [], ['2026-10-29']]) {
        assert.equal(validator.validate({ field }), false, name);
        assert.deepEqual(validator.getErrors(), { field: 'FORMAT_ERROR' }, name);
      }
    }
  }
});

test('iso_datetime: the format is checked before the bounds', () => {
  const validator = new LIVR.Validator({
    late: { iso_datetime: { max: '2026-01-01' } },
    early: { iso_datetime: { min: '2026-01-01' } },
  });

  // In UTC the year 10000 and the year -1: not a valid value, so not a bound code
  assert.equal(
    validator.validate({ late: '9999-12-31T23:30-01:00', early: '0000-01-01T00:00+01:00' }),
    false
  );
  assert.deepEqual(validator.getErrors(), { late: 'WRONG_DATETIME', early: 'WRONG_DATETIME' });
});

test('iso_date: bounds are dates, compared as calendar dates, years before 100 too', () => {
  const validator = new LIVR.Validator({
    season: { iso_date: { min: '2026-06-01', max: '2026-08-31' } },
    old: { iso_date: { min: '0050-01-01' } },
    until: { iso_date: { max: '0099-12-31' } },
  });

  const input = { season: '2026-06-01', old: '0050-01-01', until: '0099-12-31' };
  assert.deepEqual(validator.validate(input), input);
  assert.deepEqual(validator.validate({ season: '2026-08-31' }), { season: '2026-08-31' });

  assert.equal(
    validator.validate({ season: '2026-05-31', old: '0049-12-31', until: '0100-01-01' }),
    false
  );
  assert.deepEqual(validator.getErrors(), {
    season: 'DATE_TOO_EARLY',
    old: 'DATE_TOO_EARLY',
    until: 'DATE_TOO_LATE',
  });

  assert.equal(validator.validate({ season: '2026-09-01', old: '2026-02-30' }), false);
  assert.deepEqual(validator.getErrors(), { season: 'DATE_TOO_LATE', old: 'WRONG_DATE' });

  // A datetime is not a date, it is not compared with the bounds
  assert.equal(validator.validate({ season: '2026-07-01T00:00:00Z', old: [] }), false);
  assert.deepEqual(validator.getErrors(), { season: 'WRONG_DATE', old: 'FORMAT_ERROR' });
});

test('iso_datetime: the instant in UTC with three fraction digits, cut off, not rounded', () => {
  const validator = new LIVR.Validator({ at: 'iso_datetime' });

  const outputs = {
    '2026-10-29T10:00:00.123456+02:00': '2026-10-29T08:00:00.123Z',
    '2026-10-29T10:00:00.999999999Z': '2026-10-29T10:00:00.999Z',
    '2026-10-29T10:00:00.5Z': '2026-10-29T10:00:00.500Z',
    '2026-10-29T10:00:00.12-00:00': '2026-10-29T10:00:00.120Z',
    '2026-10-29T10:00:00.000+00:00': '2026-10-29T10:00:00.000Z',
    '2026-10-29T10:00:00.000Z': '2026-10-29T10:00:00.000Z',
    '2026-10-29T10:00-01:30': '2026-10-29T11:30:00.000Z',
    '2026-10-29T10:00:59Z': '2026-10-29T10:00:59.000Z',
    '2024-02-29T23:30-01:00': '2024-03-01T00:30:00.000Z',
    '2024-03-01T00:30+01:00': '2024-02-29T23:30:00.000Z',
    '2023-12-31T23:00-23:59': '2024-01-01T22:59:00.000Z',
    '2024-01-01T00:00+23:59': '2023-12-31T00:01:00.000Z',
    '0050-03-01T00:00:00.5Z': '0050-03-01T00:00:00.500Z',
    '0000-01-01T00:00-01:00': '0000-01-01T01:00:00.000Z',
    '9999-12-31T23:59:59.999999999Z': '9999-12-31T23:59:59.999Z',
  };

  for (const [at, output] of Object.entries(outputs)) {
    assert.deepEqual(validator.validate({ at }), { at: output }, at);
  }

  assert.deepEqual(validator.validate({ at: '' }), { at: '' });
  assert.deepEqual(validator.validate({}), {});

  const wrongDatetimes = [
    '2026-10-29',
    '2026-10-29T10:00',
    '2026-10-29T10:00:00',
    '2026-10-29T10:00:00.Z',
    '2026-10-29T10:00:00.1234567890Z',
    '2026-10-29t10:00:00Z',
    '2026-10-29T10:00:00z',
    '2026-10-29 10:00:00Z',
    '2026-10-29T24:00:00Z',
    '2026-10-29T10:60:00Z',
    '2026-10-29T10:00:60Z',
    '2026-10-29T10:00:00+24:00',
    '2026-10-29T10:00:00+02:60',
    '2026-10-29T10:00:00+0200',
    '2026-10-29T10:00:00+02',
    '2026-02-29T10:00:00Z',
    '2026-10-29T10:00:00Z\n',
    '2026-10-29T1:00:00Z',
    '0000-01-01T00:00+00:01',
    '9999-12-31T23:59-00:01',
    1793309400000,
    true,
  ];
  for (const at of wrongDatetimes) {
    assert.equal(validator.validate({ at }), false, String(at));
    assert.deepEqual(validator.getErrors(), { at: 'WRONG_DATETIME' }, String(at));
  }

  assert.equal(validator.validate({ at: { date: '2026-10-29' } }), false);
  assert.deepEqual(validator.getErrors(), { at: 'FORMAT_ERROR' });
});

test('iso_datetime: bounds are instants, dates are whole UTC days, cut to milliseconds', t => {
  fixClock(t, '2026-10-29T12:00:00Z');
  const validator = new LIVR.Validator({
    day: { iso_datetime: { min: '2026-10-29', max: '2026-10-29' } },
    range: {
      iso_datetime: { min: '2026-01-01T09:00:00+02:00', max: '2026-01-01T18:00:00.0009Z' },
    },
    relative: { iso_datetime: { min: 'yesterday', max: 'today' } },
  });

  const passing = [
    ['day', '2026-10-29T00:00:00.000Z'],
    ['day', '2026-10-29T23:59:59.9999Z'],
    ['day', '2026-10-30T01:59:59.999+02:00'],
    ['range', '2026-01-01T07:00Z'],
    ['range', '2026-01-01T18:00:00.000999Z'],
    ['relative', '2026-10-28T00:00Z'],
    ['relative', '2026-10-29T23:59:59.999Z'],
  ];
  for (const [field, value] of passing) {
    assert.equal(validator.validate({ [field]: value })[field].length, 24, value);
  }

  const failing = [
    ['day', '2026-10-28T23:59:59.999Z', 'DATETIME_TOO_EARLY'],
    ['day', '2026-10-30T00:00:00Z', 'DATETIME_TOO_LATE'],
    ['day', '2026-10-29T00:00:00+00:01', 'DATETIME_TOO_EARLY'],
    ['range', '2026-01-01T06:59:59.999999Z', 'DATETIME_TOO_EARLY'],
    ['range', '2026-01-01T18:00:00.001Z', 'DATETIME_TOO_LATE'],
    ['relative', '2026-10-27T23:59:59.999Z', 'DATETIME_TOO_EARLY'],
    ['relative', '2026-10-30T00:00Z', 'DATETIME_TOO_LATE'],
    ['relative', '2026-10-30', 'WRONG_DATETIME'],
  ];
  for (const [field, value, errorCode] of failing) {
    assert.equal(validator.validate({ [field]: value }), false, value);
    assert.deepEqual(validator.getErrors(), { [field]: errorCode }, value);
  }
});

test('Schema errors are thrown when the validator is prepared', () => {
  const wrongRules = [
    { boolean: true },
    { digits: 'x' },
    { iso_time: 1 },
    { iso_time: '09:00' },
    { iso_time: [['09:00']] },
    { iso_time: { from: '09:00' } },
    { iso_time: { min: '9:00' } },
    { iso_time: { max: '24:00' } },
    { iso_time: { min: 900 } },
    { not_one_of: [] },
    { not_one_of: [['a', 'b']] },
    { not_one_of: [null] },
    { starts_with: [] },
    { ends_with: '' },
    { contains: true },
    { starts_with: [null] },
    { max_decimals: -1 },
    { max_decimals: 1.5 },
    { max_decimals: '1.5' },
    { max_decimals: '-1' },
    { max_decimals: '2x' },
    { max_decimals: true },
    { max_decimals: [[2]] },
    { iso_date: { format: 'datetime' } },
    { iso_date: { format: 'date' } },
    { iso_date: { min: 'now' } },
    { iso_date: { min: 'current' } },
    { iso_date: { max: 'Today' } },
    { iso_date: { max: '2026-02-30' } },
    { iso_date: { max: '2026-1-01' } },
    { iso_date: { max: '2026-10-29T00:00:00Z' } },
    { iso_date: { max: 20260101 } },
    { iso_date: { max: null } },
    { iso_date: { min: 'toString' } },
    { iso_date: { from: 'today' } },
    { iso_datetime: 'x' },
    { iso_datetime: 1 },
    { iso_datetime: [[]] },
    { iso_datetime: 'today' },
    { iso_datetime: { format: 'datetime' } },
    { iso_datetime: { min: 'now' } },
    { iso_datetime: { min: 'current' } },
    { iso_datetime: { min: '2026-10-29T10:00' } },
    { iso_datetime: { min: '2026-10-29T10:00:00' } },
    { iso_datetime: { max: '2026-02-30' } },
    { iso_datetime: { max: '2026-10-29T24:00Z' } },
    { iso_datetime: { max: 1793309400000 } },
    { iso_datetime: { max: 'hasOwnProperty' } },
    { list_length: [] },
    { list_length: -1 },
    { list_length: [1, {}] },
    { list_length: '-1' },
    { list_length: ' 1' },
    { list_length: true },
    { list_length: [3, 1] },
    { list_length: [1, 'x'] },
    { list_length: {} },
    { list_length: { min: 1.5 } },
    { list_length: { min: null } },
    { list_length: { max: null } },
    { list_length: { min: 1, max: null } },
    { list_length: { max: 'x' } },
    { list_length: { min: 2, max: 1 } },
    { list_length: { length: 1 } },
    { unique: [true] },
    { unique: [null, 'id'] },
    { split: [] },
    { split: '' },
    { split: true },
    { split: [[',']] },
    { required_if: [] },
    { required_if: 'field' },
    { required_if: {} },
    { required_if: { a: [] } },
    { required_if: { a: ['x', ''] } },
    { required_if: { a: null } },
    { required_if: { a: [{}] } },
    { required_if: { 'a~2': 1 } },
    { required_if: { 'a~': 1 } },
  ];

  for (const rules of wrongRules) {
    const validator = new LIVR.Validator({ field: rules });
    assert.throws(() => validator.prepare(), /^Error: LIVR: /, JSON.stringify(rules));
  }
});

test('Arguments after the ones a rule takes are ignored, without a check', () => {
  const validator = new LIVR.Validator({
    split: { split: [',', ';'] },
    splitObject: { split: [',', {}] },
    decimals: { max_decimals: [2, 3] },
    length: { list_length: [1, 2, 3] },
    lengthObject: { list_length: [{ max: 1 }, 'x'] },
    date: { iso_date: [{ min: '2026-01-01' }, 'x'] },
    datetime: { iso_datetime: [{ max: '2026-01-01' }, null] },
    time: { iso_time: [{ max: '12:00' }, {}] },
    required: { required_if: [{ type: 'company' }, { other: 1 }] },
  });

  const input = {
    split: 'a,b;c',
    splitObject: 'a,b',
    decimals: '1.25',
    length: [1, 2],
    lengthObject: [1],
    date: '2026-01-01',
    datetime: '2026-01-01T00:00Z',
    time: '12:00',
  };
  assert.deepEqual(validator.validate(input), {
    ...input,
    split: ['a', 'b;c'],
    splitObject: ['a', 'b'],
    decimals: 1.25,
    datetime: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(
    validator.validate({
      decimals: 1.255,
      length: [1, 2, 3],
      lengthObject: [1, 2],
      date: '2025-12-31',
      datetime: '2026-01-02T00:00Z',
      time: '12:01',
      type: 'company',
    }),
    false
  );
  assert.deepEqual(validator.getErrors(), {
    decimals: 'TOO_MANY_DECIMALS',
    length: 'TOO_MANY_ITEMS',
    lengthObject: 'TOO_MANY_ITEMS',
    date: 'DATE_TOO_EARLY',
    datetime: 'DATETIME_TOO_LATE',
    time: 'TIME_TOO_LATE',
    required: 'REQUIRED',
  });
});

test('Numbers and strings are interchangeable in arguments', () => {
  const validator = new LIVR.Validator({
    decimals: { max_decimals: '2' },
    decimals0: { max_decimals: '0.0' },
    length: { list_length: '2' },
    between: { list_length: ['1', 2] },
    min: { list_length: { min: '1' } },
    split: { split: 0 },
    starts: { starts_with: [1, 'x'] },
    ends: { ends_with: 0.5 },
    ends5: { ends_with: 5 },
    contains: { contains: 42 },
    unique: { unique: 0 },
    mac: { mac: '64' },
  });

  const input = {
    decimals: '1.25',
    decimals0: '7.0',
    length: [1, 2],
    between: [1],
    min: [1],
    split: '102',
    starts: 15,
    ends: 10.5,
    ends5: 1.5,
    contains: 'a42b',
    unique: [{ 0: 'a' }, { 0: 'b' }],
    mac: '70-B3-D5-7E-D0-00-12-34',
  };
  assert.deepEqual(validator.validate(input), {
    ...input,
    decimals: 1.25,
    decimals0: 7,
    split: ['1', '2'],
    starts: '15',
    ends: '10.5',
    ends5: '1.5',
  });

  assert.equal(
    validator.validate({
      decimals: 1.255,
      decimals0: 0.5,
      length: [1],
      between: [],
      min: [],
      starts: 25,
      ends: 1.25,
      ends5: 1.52,
      contains: 4,
      unique: [{ 0: 'a' }, { 0: 'a' }],
      mac: '00:1A:2b:3c:4D:5e',
    }),
    false
  );
  assert.deepEqual(validator.getErrors(), {
    decimals: 'TOO_MANY_DECIMALS',
    decimals0: 'TOO_MANY_DECIMALS',
    length: 'TOO_FEW_ITEMS',
    between: 'TOO_FEW_ITEMS',
    min: 'TOO_FEW_ITEMS',
    starts: 'WRONG_FORMAT',
    ends: 'WRONG_FORMAT',
    ends5: 'WRONG_FORMAT',
    contains: 'WRONG_FORMAT',
    unique: 'NOT_UNIQUE_ITEMS',
    mac: 'WRONG_MAC',
  });
});

test('parse_json is not in LIVR 2.5', () => {
  for (const name of ['parse_json', 'parseJson']) {
    const validator = new LIVR.Validator({ field: name });
    assert.throws(() => validator.prepare(), { message: `Rule [${name}] not registered` });
    assert.equal(LIVR.rules[name], undefined);
  }
});

test('LIVR 2.5 rules have camelCase names', () => {
  const validator = new LIVR.Validator({
    requiredIf: { requiredIf: { type: 'company' } },
    notOneOf: { notOneOf: ['admin'] },
    maxDecimals: { maxDecimals: 1 },
    startsWith: { startsWith: 'a' },
    endsWith: { endsWith: 'z' },
    isoTime: 'isoTime',
    isoDatetime: { isoDatetime: { max: '9999-12-31' } },
    listLength: { listLength: 1 },
    type: 'required',
  });

  assert.deepEqual(
    validator.validate({
      requiredIf: 'x',
      notOneOf: 'root',
      maxDecimals: '1.5',
      startsWith: 'abc',
      endsWith: 'xyz',
      isoTime: '12:30',
      isoDatetime: '2026-10-29T10:00+02:00',
      listLength: [1],
      type: 'company',
    }),
    {
      requiredIf: 'x',
      notOneOf: 'root',
      maxDecimals: 1.5,
      startsWith: 'abc',
      endsWith: 'xyz',
      isoTime: '12:30',
      isoDatetime: '2026-10-29T08:00:00.000Z',
      listLength: [1],
      type: 'company',
    }
  );

  assert.equal(
    validator.validate({ type: 'company', notOneOf: 'admin', maxDecimals: 1.25 }),
    false
  );
  assert.deepEqual(validator.getErrors(), {
    requiredIf: 'REQUIRED',
    notOneOf: 'NOT_ALLOWED_VALUE',
    maxDecimals: 'TOO_MANY_DECIMALS',
  });
});

test('required_if reads the input of the enclosing object, with paths and escapes', () => {
  const validator = new LIVR.Validator({
    subscribe: 'boolean',
    email: { required_if: { subscribe: true } },
    address: { nested_object: { country: 'string', zip: { required_if: { country: 'UA' } } } },
    vat: { required_if: { 'company/0/type': ['llc', 'ngo'], 'a~1b~0c': 1 } },
  });

  // The input value, before the rules of the other field: "1" is not true
  assert.deepEqual(validator.validate({ subscribe: '1' }), { subscribe: true });
  assert.equal(validator.validate({ subscribe: 'true', address: { country: 'UA' } }), false);
  assert.deepEqual(validator.getErrors(), { email: 'REQUIRED', address: { zip: 'REQUIRED' } });

  assert.equal(validator.validate({ company: [{ type: 'ngo' }], 'a/b~c': '1' }), false);
  assert.deepEqual(validator.getErrors(), { vat: 'REQUIRED' });

  // The referenced value is missing, or not a primitive value: no match
  for (const company of [{ type: 'ngo' }, [{ type: { name: 'ngo' } }], [], 'ngo']) {
    assert.deepEqual(validator.validate({ company, 'a/b~c': 1 }), {});
  }
});

test('max_decimals reads numbers in the exponent form exactly', () => {
  const validator = new LIVR.Validator({
    decimals: { max_decimals: 7 },
    large: { max_decimals: 0 },
  });

  assert.equal(validator.validate({ decimals: 1.5e-7, large: 1.5e21 }), false);
  assert.deepEqual(validator.getErrors(), { decimals: 'TOO_MANY_DECIMALS' });

  assert.deepEqual(validator.validate({ decimals: 1e-7, large: 1.5e21 }), {
    decimals: 1e-7,
    large: 1.5e21,
  });
});

test('max_decimals: trailing zeros do not count, a string and a number of the same value agree', () => {
  // [value, decimals]
  const cases = [
    ['1.230', 2],
    [1.23, 2],
    ['1.23', 2],
    ['5.000', 0],
    ['10.0', 0],
    [10.0, 0],
    ['-0.0', 0],
    [-0, 0],
    ['007.50', 1],
    ['-1.25', 2],
    [-12.25, 2],
    ['0.10000000000000000000', 1],
    // Strings are counted as written, not as doubles
    ['0.10000000000000000001', 20],
    ['0.000001', 6],
    [1e-7, 7],
    [1.5e-7, 8],
    [1e-3, 3],
    [1e21, 0],
    ['123456789012345678901234567890', 0],
  ];

  for (const [value, decimals] of cases) {
    const name = JSON.stringify(value);
    const fits = new LIVR.Validator({ field: { max_decimals: decimals } });
    assert.deepEqual(fits.validate({ field: value }), { field: +value }, name);

    if (decimals === 0) continue;
    const tooFew = new LIVR.Validator({ field: { max_decimals: decimals - 1 } });
    assert.equal(tooFew.validate({ field: value }), false, name);
    assert.deepEqual(tooFew.getErrors(), { field: 'TOO_MANY_DECIMALS' }, name);
  }

  const validator = new LIVR.Validator({ field: { max_decimals: 2 } });
  for (const value of [
    '1.',
    '.5',
    '-',
    '-.5',
    '1.2.3',
    '1e-3',
    '+1',
    '1,5',
    ' 1',
    '1.5 ',
    '0x1',
    '\u0661',
  ]) {
    assert.equal(validator.validate({ field: value }), false, JSON.stringify(value));
    assert.deepEqual(validator.getErrors(), { field: 'NOT_NUMBER' }, JSON.stringify(value));
  }
  // Not a finite double: the output is a number, and JSON has no infinity
  for (const value of ['1' + '0'.repeat(400), '-1' + '0'.repeat(400) + '.5', NaN, Infinity]) {
    assert.equal(validator.validate({ field: value }), false, String(value));
    assert.deepEqual(validator.getErrors(), { field: 'NOT_NUMBER' }, String(value));
  }
  for (const value of [{}, []]) {
    assert.equal(validator.validate({ field: value }), false, String(value));
    assert.deepEqual(validator.getErrors(), { field: 'FORMAT_ERROR' }, String(value));
  }
  assert.deepEqual(validator.validate({ field: null }), { field: null });
  assert.deepEqual(validator.validate({ field: '1' + '0'.repeat(300) }), { field: 1e300 });
});

// A value that passes and one that fails for every rule, until the JSON test suite has the cases
test('Every rule passes a valid value and gives its error code for a wrong one', () => {
  const cases = [
    ['boolean', 'false', false, 'True', 'NOT_BOOLEAN'],
    [{ not_one_of: ['admin', 1] }, 'user', 'user', '1', 'NOT_ALLOWED_VALUE'],
    [{ max_decimals: 2 }, '0.15', 0.15, true, 'NOT_NUMBER'],
    [{ max_decimals: 1 }, '2.50', 2.5, '2.501', 'TOO_MANY_DECIMALS'],
    ['digits', '007', '007', '7a', 'NOT_DIGITS'],
    ['digits', 0, '0', -1, 'NOT_DIGITS'],
    ['digits', 1e20, '100000000000000000000', 1e21, 'NOT_DIGITS'],
    ['digits', 12, '12', 1.5, 'NOT_DIGITS'],
    ['digits', '0', '0', true, 'NOT_DIGITS'],
    ['digits', '1', '1', '١', 'NOT_DIGITS'],
    ['digits', '1', '1', [1], 'FORMAT_ERROR'],
    [{ starts_with: ['http://', 'https://'] }, 'https://a', 'https://a', 'ftp://a', 'WRONG_FORMAT'],
    [{ ends_with: '.pdf' }, 'a.pdf', 'a.pdf', 'a.PDF', 'WRONG_FORMAT'],
    [{ contains: ['@', '#'] }, 'a#b', 'a#b', {}, 'FORMAT_ERROR'],
    ['iso_time', '23:59:59.123456789', '23:59:59.123456789', '24:00', 'WRONG_TIME'],
    ['iso_time', '00:00', '00:00', '00:00:00.', 'WRONG_TIME'],
    ['iso_time', '00:00:59.1', '00:00:59.1', '00:00:00.1234567890', 'WRONG_TIME'],
    ['iso_time', '12:00', '12:00', 1200, 'WRONG_TIME'],
    ['iso_time', '12:00', '12:00', {}, 'FORMAT_ERROR'],
    [
      { iso_time: { min: '09:00', max: '18:00' } },
      '09:00:00.0',
      '09:00:00.0',
      '08:59:59.999999999',
      'TIME_TOO_EARLY',
    ],
    [
      { iso_time: { min: '09:00', max: '18:00' } },
      '18:00',
      '18:00',
      '18:00:00.000000001',
      'TIME_TOO_LATE',
    ],
    [{ iso_time: { min: '09:00', max: '18:00' } }, '12:00', '12:00', '12:00 ', 'WRONG_TIME'],
    [{ iso_time: { min: '09:00' } }, '23:59', '23:59', '08:00', 'TIME_TOO_EARLY'],
    [{ iso_time: { max: '09:00' } }, '00:00', '00:00', '09:00:01', 'TIME_TOO_LATE'],
    [{ iso_time: { min: '22:00', max: '06:00' } }, '23:30', '23:30', '07:00', 'TIME_TOO_LATE'],
    [{ iso_time: { min: '22:00', max: '06:00' } }, '00:00', '00:00', '21:00', 'TIME_TOO_EARLY'],
    [{ iso_time: { min: '22:00', max: '06:00' } }, '06:00', '06:00', '14:00', 'TIME_TOO_EARLY'],
    [
      { iso_time: { min: '22:00', max: '06:00' } },
      '22:00',
      '22:00',
      '13:59:59.999999999',
      'TIME_TOO_LATE',
    ],
    [{ iso_time: { min: '22:00', max: '06:00' } }, '05:59', '05:59', 1, 'WRONG_TIME'],
    [{ list_length: [1, 2] }, [1], [1], [1, 2, 3], 'TOO_MANY_ITEMS'],
    ['unique', [1, null, '', 2, null], [1, null, '', 2, null], [1, '1'], 'NOT_UNIQUE_ITEMS'],
    ['unique', ['a'], ['a'], [1, [1]], 'FORMAT_ERROR'],
    [
      { unique: 'id' },
      [{ id: 1 }, { id: null }, null],
      [{ id: 1 }, { id: null }, null],
      'x',
      'FORMAT_ERROR',
    ],
    [
      { unique: ['a', 'b'] },
      [
        { a: 'x,y', b: 'z' },
        { a: 'x', b: 'y,z' },
      ],
      [
        { a: 'x,y', b: 'z' },
        { a: 'x', b: 'y,z' },
      ],
      [
        { a: 1, b: 2 },
        { a: '1', b: 2 },
      ],
      'NOT_UNIQUE_ITEMS',
    ],
    [{ unique: 'id' }, [], [], [{ id: {} }], 'FORMAT_ERROR'],
    [{ unique: 'id' }, [], [], [1], 'FORMAT_ERROR'],
    // A key value of a wrong type is an error, also when another key of the item is empty
    [
      { unique: ['a', 'b'] },
      [{ a: 1, b: null }],
      [{ a: 1, b: null }],
      [{ a: null, b: [1] }],
      'FORMAT_ERROR',
    ],
    [{ unique: ['a', 'b'] }, [], [], [{ a: { x: 1 }, b: '' }], 'FORMAT_ERROR'],
  ];

  for (const [rules, value, output, wrongValue, errorCode] of cases) {
    const validator = new LIVR.Validator({ field: rules });
    const name = JSON.stringify(rules);

    assert.deepEqual(validator.validate({ field: value }), { field: output }, name);
    assert.deepEqual(validator.validate({ field: '' }), { field: '' }, name);
    assert.equal(validator.validate({ field: wrongValue }), false, name);
    assert.deepEqual(validator.getErrors(), { field: errorCode }, name);
  }
});

test('split: strings become lists, lists stay, other values are left to the next rules', () => {
  const validator = new LIVR.Validator({ ids: { split: ',' } });
  const outputs = [
    ['1,,2', ['1', '', '2']],
    [
      ['1', '2'],
      ['1', '2'],
    ],
    // Numbers and booleans in their string form
    [5, ['5']],
    [1.5, ['1.5']],
    [-1e21, ['-1e+21']],
    [true, ['true']],
    [false, ['false']],
    [NaN, NaN],
    [{ a: 1 }, { a: 1 }],
    [null, null],
    ['', ''],
  ];

  for (const [ids, output] of outputs)
    assert.deepEqual(validator.validate({ ids }), { ids: output });

  const dot = new LIVR.Validator({ value: { split: '.' }, bool: { split: 'u' } });
  assert.deepEqual(dot.validate({ value: 1.5, bool: true }), {
    value: ['1', '5'],
    bool: ['tr', 'e'],
  });
});
