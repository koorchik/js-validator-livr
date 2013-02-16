module.exports = {
    integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            return 'NOT_INTEGER';
        };
    },
    positive_integer: function() {
        return function(value) {

        };
    },
    decimal: function() {
        return function(value) {

        }
    },
    positive_decimal: function() {
        return function(value) {

        }
    },
    max_number: function() {
        return function(value) {

        }
    },            
    min_number: function() {
        return function(value) {

        }
    },            
    number_between: function() {
        return function(value) {

        }
    },            
};

