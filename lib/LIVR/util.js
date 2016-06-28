'use strict';

module.exports = {
    isPrimitiveValue: function (value) {
        if (typeof value == 'string') return true;
        if (typeof value == 'number' && isFinite(value)) return true;
        if (typeof value == 'boolean') return true;
        return false;
    },

    looksLikeNumber: function (value) {
        if (! isNaN(+value) ) return true;
        return false;
    },

    isObject: function (obj) {
        return Object(obj) === obj && Object.getPrototypeOf(obj) === Object.prototype;
    },

    isEmptyObject: function (map) {
        for(var key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    },

    escapeRegExp: function (str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    isNoValue: function(value) {
        return value === undefined || value === null || value === '';
    }
};
