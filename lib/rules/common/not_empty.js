function not_empty() {
    return value => {
        if (value !== null && value !== undefined && value === '') {
            return 'CANNOT_BE_EMPTY';
        }

        return;
    };
}

module.exports = not_empty;