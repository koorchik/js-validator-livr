'use strict';

module.exports = {
    required: function() {
        return function(value) {
            if (value === null || value === undefined || value === '') {
                return 'REQUIRED';
            }

            return;
        };
    },

    not_empty: function() {
        return function(value) {
            if (value !== null && value !== undefined && value === '') {
                return 'CANNOT_BE_EMPTY';
            }

            return;
        };
    },

    not_empty_list: function() {
        return function(list) {
            if (list === undefined || list === '') return 'CANNOT_BE_EMPTY';
            if (! Array.isArray(list) ) return 'WRONG_FORMAT';
            if (list.length < 1) return 'CANNOT_BE_EMPTY';
            return;
        };
    },
};
