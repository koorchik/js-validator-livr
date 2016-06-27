'use strict';

var fs     = require('fs');
var LIVR   = require('../lib/LIVR');
var assert = require('chai').assert;
var util   = require('util');

suite('LIVR: positive tests');

iterateTestData('test_suite/positive', function(data) {
    test(data.name, function() {
        var validator = new LIVR.Validator( data.rules );
        var output = validator.validate( data.input );

        var errors = validator.getErrors();
        assert.ok(!errors, 'Validator should contain no errors. The error was ' + util.inspect(errors) );
        assert.deepEqual(output, data.output, 'Output should contain correct data');
    });
});


suite('LIVR: negative tests');
iterateTestData('test_suite/negative', function(data) {
    test(data.name, function() {
        var validator = new LIVR.Validator( data.rules );
        var output = validator.validate( data.input );

        assert.ok(!output, 'Output should be false');
        assert.deepEqual(validator.getErrors(), data.errors, 'Validator should contain errors');
    });
});


suite('LIVR: aliases positive tests');
iterateTestData('test_suite/aliases_positive', function(data) {
    test(data.name, function() {
        var validator = new LIVR.Validator( data.rules );

        data.aliases.forEach(function(alias) {
            validator.registerAliasedRule(alias);
        });

        var output = validator.validate( data.input );

        assert.ok(! validator.getErrors(), 'Validator should contain no errors' );
        assert.deepEqual(output, data.output, 'Output should contain correct data');
    });
});

suite('LIVR: aliases negative tests');
iterateTestData('test_suite/aliases_negative', function(data) {
    test(data.name, function() {
        var validator = new LIVR.Validator( data.rules );

        data.aliases.forEach(function(alias) {
            validator.registerAliasedRule(alias);
        });

        var output = validator.validate( data.input );

        assert.ok(!output, 'Output should be false');
        assert.deepEqual(validator.getErrors(), data.errors, 'Validator should contain errors');
    });
});

function iterateTestData(path, cb) {
    var rootPath = __dirname + '/' + path;
    console.log(rootPath);
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
