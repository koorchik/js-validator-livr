const util = require('../util');

module.exports = {
    default(defaultValue) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) {
                outputArr.push(defaultValue);
            }
        };
    },

    trim() {
        return (value, params, outputArr) => {
            if (util.isNoValue(value) || typeof value === 'object') return;

            value += ''; // TODO just do not trim numbers
            outputArr.push(value.replace(/^\s*/, '').replace(/\s*$/, ''));
        };
    },

    to_lc() {
        return (value, params, outputArr) => {
            if (util.isNoValue(value) || typeof value === 'object') return;

            value += ''; // TODO just skip numbers
            outputArr.push(value.toLowerCase());
        };
    },

    to_uc() {
        return (value, params, outputArr) => {
            if (util.isNoValue(value) || typeof value === 'object') return;

            value += ''; // TODO just skip numbers
            outputArr.push(value.toUpperCase());
        };
    },

    remove(chars) {
        chars = util.escapeRegExp(chars);
        const re = new RegExp('[' + chars + ']', 'g');

        return (value, params, outputArr) => {
            if (util.isNoValue(value) || typeof value === 'object') return;

            value += ''; // TODO just skip numbers
            outputArr.push(value.replace(re, ''));
        };
    },

    leave_only(chars) {
        chars = util.escapeRegExp(chars);
        const re = new RegExp('[^' + chars + ']', 'g');

        return (value, params, outputArr) => {
            if (util.isNoValue(value) || typeof value === 'object') return;

            value += ''; // TODO just skip numbers
            outputArr.push(value.replace(re, ''));
        };
    }
};
