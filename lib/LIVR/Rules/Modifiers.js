'use strict';

var util = require('../util');

module.exports = {
    default: function(defaultValue) {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) {
                outputArr.push( defaultValue );
            }    
        };
    },

    trim: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just do not trim numbers
            outputArr.push( value.replace(/^\s*/, '').replace(/\s*$/, '') );
        };
    },

    to_lc: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.toLowerCase() );
        };
    },

    to_uc: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.toUpperCase() );
        };
    },

    remove: function(chars) {
        chars = util.escapeRegExp(chars);
        var re = new RegExp( '[' + chars +  ']', 'g' );

        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.replace(re, '') );
        };
    },

    leave_only: function(chars) {
        chars = util.escapeRegExp(chars);
        var re = new RegExp( '[^' + chars +  ']', 'g' );

        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.replace(re, '') );
        };
    },
};
