'use strict';

var util = require('../util');

module.exports =  {
    string: function() {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            outputArr.push(value+'');
            return;
        };
    },

    eq: function(allowedValue) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            if ( value+'' === allowedValue+'' ) {
                outputArr.push(allowedValue);
                return;
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    one_of: function(allowedValues) {
        if (!Array.isArray(allowedValues)) {
            allowedValues = Array.prototype.slice.call(arguments);
            allowedValues.pop(); // pop ruleBuilders
        }

        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            for (var i=0; i<allowedValues.length; i++) {
                if ( value+'' === allowedValues[i]+'' ) {
                    outputArr.push(allowedValues[i]);
                    return;
                }
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    max_length: function(maxLength) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length > maxLength ) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    min_length: function(minLength) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            outputArr.push(value);
        };
    },

    length_equal: function(length) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < length ) return 'TOO_SHORT';
            if ( value.length > length ) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    length_between: function(minLength, maxLength) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            if ( value.length > maxLength ) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    like: function(reStr, flags) {
        var isIgnoreCase = arguments.length === 3 && flags.match('i');
        var re = new RegExp(reStr, isIgnoreCase ? 'i' : '' );

        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( !value.match(re) ) return 'WRONG_FORMAT';
            outputArr.push(value);
        };
    }
};
