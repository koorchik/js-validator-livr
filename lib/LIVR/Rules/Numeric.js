module.exports = {
    integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( !value.match(/^\-?[1-9][0-9]*$/) ) return 'NOT_INTEGER';
            return;
        };
    },
    positive_integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( !value.match(/^[1-9][0-9]*$/) ) return 'NOT_POSITIVE_INTEGER';
            return;
        };
    },
    decimal: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( !value.match(/^\-?[1-9][0-9.]*$/) ) return 'NOT_DECIMAL';
            return;
        }
    },
    positive_decimal: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( !value.match(/^[1-9][0-9.]*$/) ) return 'NOT_POSITIVE_DECIMAL';
            return;
        }
    },
    max_number: function(max_number) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value > max_number ) return 'TOO_HIGH';
            return;
        }
    },            
    min_number: function(min_number) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value < min_number ) return 'TOO_LOW';
            return;

        }
    },            
    number_between: function(min_number, max_number) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value < min_number ) return 'TOO_LOW';
            if ( value > max_number ) return 'TOO_HIGH';
            return;
        }
    },            
};


function make_number(value) {
    if ( typeof(value) === "number") {
        return value;
    } else {
        return parseFloat(value);
    }
}