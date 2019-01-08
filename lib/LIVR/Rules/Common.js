'use strict';
const util = require('../util');

module.exports = {
    required: function() {
        return value => {
            if ( util.isNoValue(value) ) {
                return 'REQUIRED';
            }

            return;
        };
    },

    not_empty: function() {
        return value => {
            if (value !== null && value !== undefined && value === '') {
                return 'CANNOT_BE_EMPTY';
            }

            return;
        };
    },

    not_empty_list: function() {
        return list => {
            if (list === undefined || list === '') return 'CANNOT_BE_EMPTY';
            if (! Array.isArray(list) ) return 'FORMAT_ERROR';
            if (list.length < 1) return 'CANNOT_BE_EMPTY';
            return;
        };
    },

    any_object: function() {
        return value => {
            if ( util.isNoValue(value) ) return;

            if ( !util.isObject(value) ) {
                return 'FORMAT_ERROR';
            }
        }
    }
};
