'use strict';

var util = require('../util');

module.exports = {
    integer: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( !value.match(/^\-?[0-9]+$/) ) return 'NOT_INTEGER';
            return;
        };
    },

    positive_integer: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^[1-9][0-9]*$/.test(value) ) return 'NOT_POSITIVE_INTEGER';
            return;
        };
    },

    decimal: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^(?:\-?(?:[0-9]+\.[0-9]+)|(?:[0-9]+))$/.test(value) ) return 'NOT_DECIMAL';
            return;
        };
    },

    positive_decimal: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^(?:(?:[0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value) ) return 'NOT_POSITIVE_DECIMAL';
            return;
        };
    },

    max_number: function(maxNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
        };
    },

    min_number: function(minNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( +value < +minNumber ) return 'TOO_LOW';
            return;

        };
    },

    number_between: function(minNumber, maxNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( +value < +minNumber ) return 'TOO_LOW';
            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
        };
    },
};