module.exports =  {
    one_of: function(allowed_values) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            for (var i=0; i<allowed_values.length; i++) {
                if ( value == allowed_values[i] ) {
                    return;    
                }
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    max_length: function(max_length) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value.length > max_length ) return 'TOO_LONG';
            return;
        };
    },

    min_length: function(min_length) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value.length < min_length ) return 'TOO_SHORT';
            return;
        }
    },

    length_equal: function(length) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value.length < length ) return 'TOO_SHORT';
            if ( value.length > length ) return 'TOO_LONG';
            return;
        }
    },

    length_between: function(min_length, max_length) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value.length < min_length ) return 'TOO_SHORT';
            if ( value.length > max_length ) return 'TOO_LONG';
            return;
        }
    },            

    like: function(re) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( !value.match(re) ) return 'WRONG_FORMAT';
            return;
        }
    }
};