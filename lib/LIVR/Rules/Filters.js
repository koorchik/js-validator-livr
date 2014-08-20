'use strict';

module.exports = {
    trim: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just do not trim numbers
            outputArr.push( value.replace(/^\s*/, '').replace(/\s*$/, '') );
        };
    },

    to_lc: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.toLowerCase() );
        };
    },

    to_uc: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.toUpperCase() );
        };
    },

    remove: function(chars) {
        chars = chars.replace(/([\^\-\|\\])/g, '\\$1');
        var re = new RegExp( '[' + chars +  ']', 'g' );

        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.replace(re, '') );
        };
    },

    leave_only: function(chars) {
        chars = chars.replace(/([\^\-\|\\])/g, '\\$1');
        var re = new RegExp( '[^' + chars +  ']', 'g' );

        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.replace(re, '') );
        };
    },
};