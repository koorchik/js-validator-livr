const util = require('../../util');

function iso_date() {
    return value => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        const matched = value.match(/^(\d{4})-([0-1][0-9])-([0-3][0-9])$/);

        if (matched) {
            const epoch = Date.parse(value);
            if (!epoch && epoch !== 0) return 'WRONG_DATE';

            const d = new Date(epoch);
            d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);

            if (
                d.getFullYear() == matched[1] &&
                d.getMonth() + 1 == +matched[2] &&
                d.getDate() == +matched[3]
            ) {
                return;
            }
        }

        return 'WRONG_DATE';
    };
}

module.exports = iso_date;