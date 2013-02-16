module.exports = {
    required: function() {
        return function(value) {
            if (value === null || value === undefined || value === '') {
                return 'REQUIRED';
            }

            return;
        };
    },
    not_empty: function() {
        return function(value) {
            if (value !== null && value !== undefined && value === '') {
                return 'CANNOT_BE_EMPTY';
            }

            return;
        };
    }
};
