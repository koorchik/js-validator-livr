var LIVR = require('../lib/LIVR');
var assert = require('chai').assert;

LIVR.Validator.registerDefaultRules({
    my_trim: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += '';
            outputArr.push( value.replace(/^\s*/, '').replace(/\s*$/, '') );
        };
    },
    my_lc: function(field) {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += '';
            outputArr.push( value.toLowerCase() );
        };
    },
    my_ucfirst: function(field) {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += '';
            outputArr.push( value.charAt(0).toUpperCase() + value.slice(1) );
        };
    }
});

test('Validate data with registered rules', function() {
    var validator = new LIVR.Validator({
        word1: ['my_trim', 'my_lc', 'my_ucfirst'],
        word2: ['my_trim', 'my_lc'],
        word3: ['my_ucfirst']
    });

    var output = validator.validate({
        word1: ' wordOne ',
        word2: ' wordTwo ',
        word3: 'wordThree '
    });

    assert.deepEqual( output, {
        word1: 'Wordone',
        word2: 'wordtwo',
        word3: 'WordThree '
    }, 'Should appluy changes to values' );
});