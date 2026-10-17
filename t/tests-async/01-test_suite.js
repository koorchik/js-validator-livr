const test = require('node:test');
const assert = require('node:assert/strict');

const fs   = require('fs');
const LIVR = require('../../async');

iterateTestData('test_suite/positive', data => {
    test(`Positive: ${data.name}`, async () => {
        const validator = new LIVR.AsyncValidator(data.rules);
        const output = await validator.validate(data.input);

        assert.deepEqual(output, data.output, 'Output should contain correct data');
    });
});

iterateTestData('test_suite/negative', data => {
    test(`Negative ${data.name}`, async () => {
        const validator = new LIVR.AsyncValidator(data.rules);

        try {
            const output = await validator.validate(data.input);    
        } catch (errors) {
            assert.deepEqual(errors, data.errors, 'Validator should contain errors');    
        }
    });
});

iterateTestData('test_suite/aliases_positive', data => {
    test(`Aliases positive: ${data.name}`, async () => {
        const validator = new LIVR.AsyncValidator(data.rules);

        data.aliases.forEach(alias => {
            validator.registerAliasedRule(alias);
        });

        const output = await validator.validate(data.input);
        assert.deepEqual(output, data.output, 'Output should contain correct data');
    });
});

iterateTestData('test_suite/aliases_negative', data => {
    test(`Aliases negative: ${data.name}`, async () => {
        const validator = new LIVR.AsyncValidator(data.rules);

        data.aliases.forEach(alias => {
            validator.registerAliasedRule(alias);
        });

        try {
            const output = await validator.validate(data.input);    
        } catch (errors) {
            assert.deepEqual(errors, data.errors, 'Validator should contain errors');    
        }
    });
});

function iterateTestData(path, cb) {
    const rootPath = __dirname + '/../' + path;
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
