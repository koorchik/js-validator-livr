const test = require('ava');

const fs   = require('fs');
const LIVR = require('../lib/LIVR');
const util = require('util');

iterateTestData('test_suite/positive', data => {
    test(`Positive: ${data.name}`, t => {
        const validator = new LIVR.Validator(data.rules);
        const output = validator.validate(data.input);

        const errors = validator.getErrors();
        t.true(
            !errors,
            'Validator should contain no errors. The error was ' + util.inspect(errors)
        );
        t.deepEqual(output, data.output, 'Output should contain correct data');
    });
});

iterateTestData('test_suite/negative', data => {
    test(`Negative ${data.name}`, t => {
        const validator = new LIVR.Validator(data.rules);
        const output = validator.validate(data.input);

        t.true(!output, 'Output should be false');
        t.deepEqual(validator.getErrors(), data.errors, 'Validator should contain errors');
    });
});

iterateTestData('test_suite/aliases_positive', data => {
    test(`Aliases positive: ${data.name}`, t => {
        const validator = new LIVR.Validator(data.rules);

        data.aliases.forEach(alias => {
            validator.registerAliasedRule(alias);
        });

        const output = validator.validate(data.input);

        t.true(!validator.getErrors(), 'Validator should contain no errors');
        t.deepEqual(output, data.output, 'Output should contain correct data');
    });
});

iterateTestData('test_suite/aliases_negative', data => {
    test(`Aliases negative: ${data.name}`, t => {
        const validator = new LIVR.Validator(data.rules);

        data.aliases.forEach(alias => {
            validator.registerAliasedRule(alias);
        });

        const output = validator.validate(data.input);

        t.true(!output, 'Output should be false');
        t.deepEqual(validator.getErrors(), data.errors, 'Validator should contain errors');
    });
});

function iterateTestData(path, cb) {
    const rootPath = __dirname + '/' + path;
    console.log(`ITERATE: ${rootPath}`);
    const casesDirs = fs.readdirSync(rootPath);

    for (const caseDir of casesDirs) {
        const caseFiles = fs.readdirSync(rootPath + '/' + caseDir);
        const caseData = { name: caseDir };

        for (const file of caseFiles) {
            const json = fs.readFileSync(rootPath + '/' + caseDir + '/' + file);

            caseData[file.replace(/\.json$/, '')] = JSON.parse(json);
        }

        cb(caseData);
    }
}
