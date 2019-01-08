const util = require('../util');

module.exports = {
    string() {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            outputArr.push(value + '');
            return;
        };
    },

    eq(allowedValue) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            if (value + '' === allowedValue + '') {
                outputArr.push(allowedValue);
                return;
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    one_of(allowedValues) {
        if (!Array.isArray(allowedValues)) {
            allowedValues = Array.prototype.slice.call(arguments);
            allowedValues.pop(); // pop ruleBuilders
        }

        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;

            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            for (const allowedValue of allowedValues) {
                if (value + '' === allowedValue + '') {
                    outputArr.push(allowedValue);
                    return;
                }
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    max_length(maxLength) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if (value.length > maxLength) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    min_length(minLength) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if (value.length < minLength) return 'TOO_SHORT';
            outputArr.push(value);
        };
    },

    length_equal(length) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if (value.length < length) return 'TOO_SHORT';
            if (value.length > length) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    length_between(minLength, maxLength) {
        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if (value.length < minLength) return 'TOO_SHORT';
            if (value.length > maxLength) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    like(reStr, flags) {
        const isIgnoreCase = arguments.length === 3 && flags.match('i');
        const re = new RegExp(reStr, isIgnoreCase ? 'i' : '');

        return (value, params, outputArr) => {
            if (util.isNoValue(value)) return;

            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if (!value.match(re)) return 'WRONG_FORMAT';
            outputArr.push(value);
        };
    }
};
