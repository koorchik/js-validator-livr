'use strict';

var util = require('../util');

module.exports = {
    integer: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_INTEGER';

            if ( !Number.isInteger(+value) ) return 'NOT_INTEGER';
            outputArr.push(+value);
        };
    },

    positive_integer: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_INTEGER';

            if ( !Number.isInteger(+value) || +value < 1 ) return 'NOT_POSITIVE_INTEGER';
            outputArr.push(+value);
        };
    },

    decimal: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_DECIMAL';

            value += '';
            if ( ! /^(?:\-?(?:(?:[0-9]+\.[0-9]+)|(?:[0-9]+)))$/.test(value) ) return 'NOT_DECIMAL';
            outputArr.push(+value);
        };
    },

    positive_decimal: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_DECIMAL';

            value += '';
            if ( ! /^(?:(?:[0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value) ) return 'NOT_POSITIVE_DECIMAL';
            outputArr.push(+value);
        };
    },

    max_number: function(maxNumber) {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value > +maxNumber ) return 'TOO_HIGH';
            outputArr.push(+value);
        };
    },

    min_number: function(minNumber) {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value < +minNumber ) return 'TOO_LOW';
            outputArr.push(+value);

        };
    },

    number_between: function(minNumber, maxNumber) {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value < +minNumber ) return 'TOO_LOW';
            if ( +value > +maxNumber ) return 'TOO_HIGH';
            outputArr.push(+value);
        };
    },
};
