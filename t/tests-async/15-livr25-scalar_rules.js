// LIVR 2.5 scalar rules in AsyncValidator: the system clock in the async meta rules
const test = require('node:test');
const assert = require('node:assert/strict');
const LIVR = require('../../async');

const NOT_FUTURE = { iso_date: { max: 'today' } };

test('Fake timers fix the clock of async meta rules and aliases', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-29T12:00:00Z') });
  const validator = new LIVR.AsyncValidator({
    date: NOT_FUTURE,
    nested: { nested_object: { date: NOT_FUTURE } },
    list: { list_of: NOT_FUTURE },
    either: { or: [NOT_FUTURE, 'integer'] },
    aliased: 'livr25_async_not_future',
    at: { list_of: { iso_datetime: { min: 'yesterday', max: 'today' } } },
  });
  validator.registerAliasedRule({ name: 'livr25_async_not_future', rules: NOT_FUTURE });

  const tomorrow = '2026-10-30';
  await assert.rejects(
    validator.validate({
      date: tomorrow,
      nested: { date: tomorrow },
      list: [tomorrow],
      either: tomorrow,
      aliased: tomorrow,
      at: ['2026-10-27T23:59:59.999Z', '2026-10-30T00:00Z'],
    }),
    errors => {
      assert.deepEqual(errors, {
        date: 'DATE_TOO_LATE',
        nested: { date: 'DATE_TOO_LATE' },
        list: ['DATE_TOO_LATE'],
        either: 'NOT_INTEGER',
        aliased: 'DATE_TOO_LATE',
        at: ['DATETIME_TOO_EARLY', 'DATETIME_TOO_LATE'],
      });
      return true;
    }
  );

  const today = '2026-10-29';
  const input = { date: today, nested: { date: today }, list: [today], either: today };
  assert.deepEqual(await validator.validate({ ...input, at: ['2026-10-29T23:59:59.999+02:00'] }), {
    ...input,
    at: ['2026-10-29T21:59:59.999Z'],
  });
});

test('LIVR 2.5 date and time rules in AsyncValidator: outputs, codes, schema errors', async () => {
  const validator = new LIVR.AsyncValidator({
    date: { iso_date: { min: '2026-01-01' } },
    at: 'isoDatetime',
    time: { iso_time: { max: '18:00' } },
    zip: 'digits',
  });

  assert.deepEqual(await validator.validate({ at: '2026-10-29T10:00+02:00', zip: 7 }), {
    at: '2026-10-29T08:00:00.000Z',
    zip: '7',
  });

  await assert.rejects(
    validator.validate({ date: '2025-12-31', at: '2026-10-29', time: '18:00:01', zip: '7a' }),
    errors => {
      assert.deepEqual(errors, {
        date: 'DATE_TOO_EARLY',
        at: 'WRONG_DATETIME',
        time: 'TIME_TOO_LATE',
        zip: 'NOT_DIGITS',
      });
      return true;
    }
  );

  for (const rules of [
    { iso_date: { format: 'datetime' } },
    { iso_datetime: 'x' },
    { iso_date: { max: 'current' } },
    { iso_datetime: { min: 'current' } },
    { uuid: 4 },
    { ip: 4 },
    { digits: 1 },
    { iso_date: 'today' },
    { iso_date: { min: 'tomorrow', max: 'today' } },
    { iso_datetime: { min: '2026-01-02', max: '2026-01-01' } },
  ]) {
    assert.throws(() => new LIVR.AsyncValidator({ field: rules }).prepare(), /^Error: LIVR: /);
  }
});

test('parse_json is not in LIVR 2.5', () => {
  for (const name of ['parse_json', 'parseJson']) {
    const validator = new LIVR.AsyncValidator({ field: name });
    assert.throws(() => validator.prepare(), { message: `Rule [${name}] not registered` });
    assert.equal(LIVR.rules[name], undefined);
  }
});

test('max_decimals in AsyncValidator: trailing zeros do not count', async () => {
  const validator = new LIVR.AsyncValidator({
    string: { max_decimals: 2 },
    number: { max_decimals: 2 },
    zeros: { max_decimals: 0 },
  });

  assert.deepEqual(await validator.validate({ string: '1.230', number: 1.23, zeros: '5.000' }), {
    string: 1.23,
    number: 1.23,
    zeros: 5,
  });

  await assert.rejects(validator.validate({ string: '1.2340', number: 1.234, zeros: '0.5' }), {
    string: 'TOO_MANY_DECIMALS',
    number: 'TOO_MANY_DECIMALS',
    zeros: 'TOO_MANY_DECIMALS',
  });
});
