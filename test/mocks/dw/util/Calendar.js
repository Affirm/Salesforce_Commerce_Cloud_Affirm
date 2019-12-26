/**
 * Represents dw.util.Calendar
*/

var Calendar = function () {};

Calendar.prototype.AM_PM = 9; // Number
Calendar.prototype.APRIL = 3; // Number
Calendar.prototype.AUGUST = 7; // Number
Calendar.prototype.DATE = 5; // Number
Calendar.prototype.DAY_OF_MONTH = 5; // Number
Calendar.prototype.DAY_OF_WEEK = 7; // Number
Calendar.prototype.DAY_OF_WEEK_IN_MONTH = 8; // Number
Calendar.prototype.DAY_OF_YEAR = 6; // Number
Calendar.prototype.DECEMBER = 11; // Number
Calendar.prototype.DST_OFFSET = 16; // Number
Calendar.prototype.ERA = 0; // Number
Calendar.prototype.FEBRUARY = 1; // Number
Calendar.prototype.FRIDAY = 6; // Number
Calendar.prototype.HOUR = 10; // Number
Calendar.prototype.HOUR_OF_DAY = 11; // Number
Calendar.prototype.INPUT_DATE_PATTERN = 3; // Number
Calendar.prototype.INPUT_DATE_TIME_PATTERN = 5; // Number
Calendar.prototype.INPUT_TIME_PATTERN = 4; // Number
Calendar.prototype.JANUARY = 0; // Number
Calendar.prototype.JULY = 6; // Number
Calendar.prototype.JUNE = 5; // Number
Calendar.prototype.LONG_DATE_PATTERN = 1; // Number
Calendar.prototype.MARCH = 2; // Number
Calendar.prototype.MAY = 4; // Number
Calendar.prototype.MILLISECOND = 14; // Number
Calendar.prototype.MINUTE = 12; // Number
Calendar.prototype.MONDAY = 2; // Number
Calendar.prototype.MONTH = 2; // Number
Calendar.prototype.NOVEMBER = 10; // Number
Calendar.prototype.OCTOBER = 9; // Number
Calendar.prototype.SATURDAY = 7; // Number
Calendar.prototype.SECOND = 13; // Number
Calendar.prototype.SEPTEMBER = 8; // Number
Calendar.prototype.SHORT_DATE_PATTERN = 0; // Number
Calendar.prototype.SUNDAY = 1; // Number
Calendar.prototype.THURSDAY = 5; // Number
Calendar.prototype.TIME_PATTERN = 2; // Number
Calendar.prototype.TUESDAY = 3; // Number
Calendar.prototype.WEDNESDAY = 4; // Number
Calendar.prototype.WEEK_OF_MONTH = 4; // Number
Calendar.prototype.WEEK_OF_YEAR = 3; // Number
Calendar.prototype.YEAR = 1; // Number
Calendar.prototype.ZONE_OFFSET = 15; // Number

Calendar.prototype.firstDayOfWeek = null; // Number
Calendar.prototype.time = null; // Date
Calendar.prototype.timeZone = null; // String

Calendar.prototype.add = function (field, value) {}; // void
Calendar.prototype.after = function (obj) {}; // boolean
Calendar.prototype.before = function (obj) {}; // boolean
Calendar.prototype.clear = function () {}; // void
Calendar.prototype.clear = function (field) {}; // void
Calendar.prototype.compareTo = function (anotherCalendar) {}; // Number
Calendar.prototype.equals = function (other) {}; // boolean
Calendar.prototype.get = function (field) {}; // Number
Calendar.prototype.getActualMaximum = function (field) {}; // Number
Calendar.prototype.getActualMinimum = function (field) {}; // Number
Calendar.prototype.getFirstDayOfWeek = function () {}; // Number
Calendar.prototype.getMaximum = function (field) {}; // Number
Calendar.prototype.getMinimum = function (field) {}; // Number
Calendar.prototype.getTime = function () { return this.time; }; // Date
Calendar.prototype.getTimeZone = function () {}; // String
Calendar.prototype.hashCode = function () {}; // Number
Calendar.prototype.isLeapYear = function (year) {}; // boolean
Calendar.prototype.isSameDay = function (other) {}; // boolean
Calendar.prototype.isSameDayByTimestamp = function (other) {}; // boolean
Calendar.prototype.isSet = function (field) {}; // boolean
Calendar.prototype.parseByFormat = function (timeString, format) {
    switch (format) {
        case 'yyyy-MM-dd':
            var dateArr = timeString.split('-').map(function (str) { return Number.parseInt(str, 10); });
            this.time = new Date(dateArr[0], --dateArr[1], dateArr[2]);
            break;
        default:
            break;
    }
}; // void
Calendar.prototype.parseByLocale = function (timeString, locale, pattern) {}; // void
Calendar.prototype.roll = function (field, up) {}; // void
Calendar.prototype.roll = function (field, amount) {}; // void
Calendar.prototype.set = function (field, value) {}; // void
Calendar.prototype.set = function (year, month, date) {}; // void
Calendar.prototype.set = function (year, month, date, hourOfDay, minute) {}; // void
Calendar.prototype.set = function (year, month, date, hourOfDay, minute, second) {}; // void
Calendar.prototype.setFirstDayOfWeek = function (value) {}; // void
Calendar.prototype.setTime = function (date) {}; // void
Calendar.prototype.setTimeZone = function (timeZone) {}; // void

module.exports = Calendar;
