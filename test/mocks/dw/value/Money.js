var Decimal = require('../util/Decimal');
var Money = function (value, currencyCode) {
    this.value = value;
    this.currencyCode = currencyCode || 'USD';
};

Money.prototype.NOT_AVAILABLE = null; // Money
Money.prototype.available = null; // boolean
Money.prototype.decimalValue = null; // Decimal
Money.prototype.valueOrNull = null; // Number

var valueOf = function (value) {
    if (typeof (value) === 'object' && value !== null) {
        return value.value;
    }
    return value;
};

Money.prototype.add = function (value) { return new Money(this.value + valueOf(value), 'USD'); }; // Money
Money.prototype.addPercent = function (percent) {}; // Money
Money.prototype.addRate = function (value) {}; // Money
Money.prototype.compareTo = function (other) {}; // Number
Money.prototype.divide = function (divisor) { return new Money(this.value / divisor, 'USD'); }; // Money
Money.prototype.equals = function (other) {}; // boolean
Money.prototype.getCurrencyCode = function () {}; // String
Money.prototype.getDecimalValue = function () { return new Decimal(this.value); }; // Decimal
Money.prototype.getValue = function () { return this.value; }; // Number
Money.prototype.getValueOrNull = function () {}; // Number
Money.prototype.hashCode = function () {}; // Number
Money.prototype.isAvailable = function () {}; // boolean
Money.prototype.isOfSameCurrency = function (value) {}; // boolean
Money.prototype.multiply = function (factor) {}; // Money
Money.prototype.multiply = function (quantity) { return new Money(this.value * quantity, 'USD'); }; // Money
Money.prototype.newMoney = function (value) {}; // Money
Money.prototype.percentLessThan = function (value) {}; // Number
Money.prototype.percentOf = function (value) {}; // Number
Money.prorate = function (dist, values) {}; // Money[]

Money.prototype.subtract = function (value) { return new Money(this.value - valueOf(value), 'USD'); }; // Money
Money.prototype.subtractPercent = function (percent) {}; // Money
Money.prototype.subtractRate = function (value) {}; // Money
Money.prototype.toFormattedString = function () { return String.valueOf(this.value); }; // String
Money.prototype.toNumberString = function () {}; // String
Money.prototype.toString = function () {}; // String
Money.prototype.valueOf = function () {}; // Object
Money.prototype.available = function () { return this.value !== 0; }; // boolean
module.exports = Money;
