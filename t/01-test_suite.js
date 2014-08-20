'use strict';

var fs = require('fs');
var LIVR = require('../lib/LIVR');

QUnit.module('LIVR: positive tests');
iterateTestData('test_suite/positive', function(data) {
    test(data.name, function() {
        var validator = new LIVR.Validator( data.rules );
        var output = validator.validate( data.input );

        ok(! validator.getErrors(), 'Validator should contain no errors' );
        deepEqual(output, data.output, 'Output should contain correct data');
    });
});


QUnit.module('LIVR: negative tests');
iterateTestData('test_suite/negative', function(data) {
    test(data.name, function() {
        var validator = new LIVR.Validator( data.rules );
        var output = validator.validate( data.input );

        ok(!output, 'Output should be false');
        deepEqual(validator.getErrors(), data.errors, 'Validator should contain errors');
    });
});


QUnit.module('LIVR: aliases positive tests');
iterateTestData('test_suite/aliases_positive', function(data) {
    test(data.name, function() {
        var validator = new LIVR.Validator( data.rules );

        data.aliases.forEach(function(alias) {
            validator.registerAliasedRule(alias);
        });

        var output = validator.validate( data.input );

        ok(! validator.getErrors(), 'Validator should contain no errors' );
        deepEqual(output, data.output, 'Output should contain correct data');
    });
});

QUnit.module('LIVR: aliases negative tests');
iterateTestData('test_suite/aliases_negative', function(data) {
    test(data.name, function() {
        var validator = new LIVR.Validator( data.rules );

        data.aliases.forEach(function(alias) {
            validator.registerAliasedRule(alias);
        });

        var output = validator.validate( data.input );

        ok(!output, 'Output should be false');
        deepEqual(validator.getErrors(), data.errors, 'Validator should contain errors');
    });
});

function iterateTestData(rootPath, cb) {
    var casesDirs = fs.readdirSync(rootPath);

    for (var i = 0; i < casesDirs.length; i++) {
        var caseDir = casesDirs[i];
        var caseFiles = fs.readdirSync(rootPath + '/' + caseDir);
        var caseData = {name: caseDir};

        for (var j = 0; j < caseFiles.length; j++) {
            var file = caseFiles[j];
            var json = fs.readFileSync(rootPath + '/' + caseDir + '/' + file);

            caseData[ file.replace(/\.json$/, '') ] = JSON.parse(json);
        }

        cb(caseData);
    }
}