// The LIVR 2.5 draft test suite (t/test_suite_2.5, a copy of test_suite_2.5 from the LIVR repository)
const test = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const LIVR = require('../../lib/LIVR');
const util = require('util');

for (const suite of ['positive', 'negative', 'aliases_positive', 'aliases_negative']) {
  iterateTestData(`test_suite_2.5/${suite}`, data => {
    test(`LIVR 2.5 ${suite}: ${data.name}`, t => {
      // options.json fixes the current time for the bounds today, yesterday and tomorrow:
      // the rules read Date.now(), the fake timers of node:test replace it for this test
      fixClock(t, data.options);
      const validator = new LIVR.Validator(data.rules);

      for (const alias of data.aliases || []) validator.registerAliasedRule(alias);

      const output = validator.validate(data.input);

      if (suite.endsWith('positive')) {
        const errors = validator.getErrors();
        assert.ok(
          !errors,
          'Validator should contain no errors. The error was ' + util.inspect(errors)
        );
        assert.deepEqual(output, data.output, 'Output should contain correct data');
      } else {
        assert.ok(!output, 'Output should be false');
        assert.deepEqual(validator.getErrors(), data.errors, 'Validator should contain errors');
      }
    });
  });
}

// Schemas that must not build: the case passes when prepare() throws
iterateTestData('test_suite_2.5/schema_errors', data => {
  test(`LIVR 2.5 schema_errors: ${data.name}`, t => {
    fixClock(t, data.options);
    assert.throws(
      () => {
        const validator = new LIVR.Validator(data.rules);
        for (const alias of data.aliases || []) validator.registerAliasedRule(alias);
        validator.prepare();
      },
      Error,
      JSON.stringify(data.rules)
    );
  });
});

function fixClock(t, options) {
  if (options && options.now !== undefined) {
    t.mock.timers.enable({ apis: ['Date'], now: new Date(options.now) });
  }
}

function iterateTestData(path, cb) {
  const rootPath = __dirname + '/../' + path;

  if (!fs.existsSync(rootPath)) return;

  for (const caseDir of fs.readdirSync(rootPath)) {
    if (!fs.statSync(rootPath + '/' + caseDir).isDirectory()) continue;
    const caseData = { name: caseDir };

    for (const file of fs.readdirSync(rootPath + '/' + caseDir)) {
      const json = fs.readFileSync(rootPath + '/' + caseDir + '/' + file);
      caseData[file.replace(/\.json$/, '')] = JSON.parse(json);
    }

    cb(caseData);
  }
}
