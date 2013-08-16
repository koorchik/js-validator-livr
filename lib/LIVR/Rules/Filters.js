module.exports = {
    trim: function() {
        return function(value, undefined, output_arr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just do not trim numbers
            output_arr.push( value.replace(/^\s*/, '').replace(/\s*$/, '') );
        };
    },
    to_lc: function(field) {
        return function(value, undefined, output_arr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skup numbers
            output_arr.push( value.toLowerCase() );
        };
    },
    to_uc: function(field) {
        return function(value, undefined, output_arr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skup numbers
            output_arr.push( value.toUpperCase() );
        };
    }
};