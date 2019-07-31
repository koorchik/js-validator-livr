module.exports = {
    isPrimitiveValue(value) {
        if (typeof value == 'string') return true;
        if (typeof value == 'number' && isFinite(value)) return true;
        if (typeof value == 'boolean') return true;
        return false;
    },

    looksLikeNumber(value) {
        if (!isNaN(+value)) return true;
        return false;
    },

    isObject(obj) {
        return Object(obj) === obj && Object.getPrototypeOf(obj) === Object.prototype;
    },

    isEmptyObject(map) {
        for (const key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    },

    escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },

    isNoValue(value) {
        return value === undefined || value === null || value === '';
    }
};
