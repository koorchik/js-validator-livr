'use strict';

module.exports = {
    isNumberOrString: function (value) {
        if (typeof value == 'string') return true;
        if (typeof value == 'number' && isFinite(value)) return true;
        return false;
    },

    isObject: function (obj) {
        // TODO make better checking
        return obj === Object(obj);
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
