module.exports = {
    integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( !value.match(/^\-?[0-9]+$/) ) return 'NOT_INTEGER';
            return;
        };
    },

    positive_integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( ! /^[1-9][0-9]*$/.test(value) ) return 'NOT_POSITIVE_INTEGER';
            return;
        };
    },

    decimal: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( ! /^(?:\-?(?:[0-9]+\.[0-9]+)|(?:[0-9]+))$/.test(value) ) return 'NOT_DECIMAL';
            return;
        };
    },

    positive_decimal: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( ! /^(?:(?:[1-9][0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value) ) return 'NOT_POSITIVE_DECIMAL';
            return;
        };
    },

    max_number: function(maxNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
        };
    },

    min_number: function(minNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( +value < +minNumber ) return 'TOO_LOW';
            return;

        };
    },

    number_between: function(minNumber, maxNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( +value < +minNumber ) return 'TOO_LOW';
            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
        };
    },
};