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
        const proto = Object.getPrototypeOf(obj);
        return Object(obj) === obj && (proto === Object.prototype || proto === null);
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
