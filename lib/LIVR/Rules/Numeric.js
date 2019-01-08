const util = require('../util');

module.exports = {
    integer() {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_INTEGER';

            if (!Number.isInteger(+value)) return 'NOT_INTEGER';
            outputArr.push(+value);
        };
    },

    positive_integer() {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_INTEGER';

            if (!Number.isInteger(+value) || +value < 1) return 'NOT_POSITIVE_INTEGER';
            outputArr.push(+value);
        };
    },

    decimal() {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_DECIMAL';

            value += '';
            if (!/^(?:\-?(?:(?:[0-9]+\.[0-9]+)|(?:[0-9]+)))$/.test(value)) return 'NOT_DECIMAL';
            outputArr.push(+value);
        };
    },

    positive_decimal() {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_DECIMAL';

            value += '';
            if (!/^(?:(?:[0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value))
                return 'NOT_POSITIVE_DECIMAL';
            outputArr.push(+value);
        };
    },

    max_number(maxNumber) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if (+value > +maxNumber) return 'TOO_HIGH';
            outputArr.push(+value);
        };
    },

    min_number(minNumber) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if (+value < +minNumber) return 'TOO_LOW';
            outputArr.push(+value);
        };
    },

    number_between(minNumber, maxNumber) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if (+value < +minNumber) return 'TOO_LOW';
            if (+value > +maxNumber) return 'TOO_HIGH';
            outputArr.push(+value);
        };
    }
};
