module.exports = {
    trim: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just do not trim numbers
            outputArr.push( value.replace(/^\s*/, '').replace(/\s*$/, '') );
        };
    },
    to_lc: function(field) {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skup numbers
            outputArr.push( value.toLowerCase() );
        };
    },
    to_uc: function(field) {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skup numbers
            outputArr.push( value.toUpperCase() );
        };
    }
};