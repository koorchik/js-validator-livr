'use strict';

module.exports = {
    email: function() {
        var emailRe = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/);

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( ! emailRe.test(value) ) return 'WRONG_EMAIL';
            if ( /\@.*\@/.test(value) ) return 'WRONG_EMAIL';
            return;
        };
    },

    equal_to_field: function(field) {
        return function(value, params) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value != params[field] ) return 'FIELDS_NOT_EQUAL';
            return;
        };
    },

    url: function() {
        var urlReStr = '^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
        var urlRe = new RegExp(urlReStr, 'i');

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if (value.length < 2083 && urlRe.test(value)) return;
            return 'WRONG_URL';
        };
    },

    iso_date: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            var matched = value.match(/^(\d{4})-([0-1][0-9])-([0-3][0-9])$/);

            if (matched) {
                var epoch = Date.parse(value);
                if (!epoch) return 'WRONG_DATE';

                var d = new Date(epoch);

                if ( d.getUTCFullYear() == matched[1] && d.getMonth()+1 == +matched[2] && d.getDate() == +matched[3] ) {
                    return;
                }
            }

            return 'WRONG_DATE';
        };
    }
};
