const hasOwn = Object.prototype.hasOwnProperty;

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
        if (obj?.constructor === Object) return true;

        // Objects with own "constructor" key, and objects without prototype
        // (from Object.create(null), querystring.parse() and others)
        if (typeof obj !== 'object' || obj === null) return false;
        const proto = Object.getPrototypeOf(obj);
        return proto === Object.prototype || proto === null;
    },

    isEmptyObject(obj) {
        for (const key in obj) {
            return false;
        }
        return true;
    },

    escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },

    isNoValue(value) {
        return value === undefined || value === null || value === '';
    },

    isThenable(value) {
        return !!value && typeof value.then === 'function';
    },

    // Value of a field of the validated data. Inherited methods ("constructor", "toString"...)
    // are not data, so such missing fields are undefined
    getFieldValue(data, fieldName) {
        const value = data[fieldName];
        if (typeof value === 'function' && !hasOwn.call(data, fieldName)) return;
        return value;
    },

    camelize(str) {
        return (str + '').replace(/[_](\w|$)/g, (_, firstLetter) => firstLetter.toUpperCase());
    },
};
