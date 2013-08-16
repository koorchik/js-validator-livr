module.exports = {
    email: function() {
        var emailRe = new RegExp(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( ! emailRe.test(value) ) return 'WRONG_EMAIL';
            return;
        };
    },
    equal_to_field: function(field) {
        return function(value, params) {
            if (value === undefined || value === null || value === '' ) return;
            
            if ( value != params[field] ) return 'FIELDS_NOT_EQUAL';
            return;
        };
    }
};