module.exports =  {
    one_of: function(allowedValues) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            for (var i=0; i<allowedValues.length; i++) {
                if ( value == allowedValues[i] ) {
                    return;    
                }
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    max_length: function(maxLength) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.length > maxLength ) return 'TOO_LONG';
            return;
        };
    },

    min_length: function(minLength) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            return;
        }
    },

    length_equal: function(length) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.length < length ) return 'TOO_SHORT';
            if ( value.length > length ) return 'TOO_LONG';
            return;
        }
    },

    length_between: function(minLength, maxLength) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            if ( value.length > maxLength ) return 'TOO_LONG';
            return;
        }
    },            

    like: function(re) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( !value.match(re) ) return 'WRONG_FORMAT';
            return;
        }
    }
};