'use strict';

var util = require('../util');

module.exports = {
    integer: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_INTEGER';

            if ( !Number.isInteger(+value) ) return 'NOT_INTEGER';
            return;
        };
    },

    positive_integer: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_INTEGER';

            if ( !Number.isInteger(+value) || +value < 1 ) return 'NOT_POSITIVE_INTEGER';
            return;
        };
    },

    decimal: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_DECIMAL';

            value += '';
            if ( ! /^(?:\-?(?:[0-9]+\.[0-9]+)|(?:[0-9]+))$/.test(value) ) return 'NOT_DECIMAL';
            return;
        };
    },

    positive_decimal: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_DECIMAL';

            value += '';
            if ( ! /^(?:(?:[0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value) ) return 'NOT_POSITIVE_DECIMAL';
            return;
        };
    },

    max_number: function(maxNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
        };
    },

    min_number: function(minNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value < +minNumber ) return 'TOO_LOW';
            return;

        };
    },

    number_between: function(minNumber, maxNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value < +minNumber ) return 'TOO_LOW';
            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
        };
    },
};
