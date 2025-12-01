const util = require('../../util');

const ISO_DATE_RE = /^(\d{4})-([0-1][0-9])-([0-3][0-9])$/;

// Days in each month (index 0 = January)
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function iso_date() {
    return value => {
        if (util.isNoValue(value)) return;
        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

        const matched = (value + '').match(ISO_DATE_RE);

        if (matched) {
            const year = +matched[1];
            const month = +matched[2];
            const day = +matched[3];

            // Validate month (1-12)
            if (month < 1 || month > 12) return 'WRONG_DATE';

            // Get max days for this month
            let maxDays = DAYS_IN_MONTH[month - 1];

            // February leap year check
            if (month === 2 && isLeapYear(year)) {
                maxDays = 29;
            }

            // Validate day
            if (day >= 1 && day <= maxDays) {
                return;
            }
        }

        return 'WRONG_DATE';
    };
}

module.exports = iso_date;