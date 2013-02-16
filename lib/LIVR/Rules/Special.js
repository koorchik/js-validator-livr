module.exports = {
    email: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.match(/\@/) ) return 'WRONG_EMAIL';
            return;
        };
    },
    equal_to_field: function(field) {
        return function(value, params) {
            if ( value != params[field] ) return 'FIELDS_NOT_EQUAL';
            return;
        };
    }
};