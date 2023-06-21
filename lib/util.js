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
        return obj?.constructor === Object;
    },

    isEmptyObject(obj) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
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
    },
    
    camelize(str) {
        return (str+"").replace(
            /[_](\w|$)/g, 
            (_, firstLetter) => firstLetter.toUpperCase()
        );
    }
};
