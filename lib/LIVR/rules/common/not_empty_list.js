function not_empty_list() {
    return list => {
        if (list === undefined || list === '') return 'CANNOT_BE_EMPTY';
        if (!Array.isArray(list)) return 'FORMAT_ERROR';
        if (list.length < 1) return 'CANNOT_BE_EMPTY';
        return;
    };
};

module.exports = not_empty_list;