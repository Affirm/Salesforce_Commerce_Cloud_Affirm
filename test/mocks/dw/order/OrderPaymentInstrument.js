var _super = require('./PaymentInstrument');
var PaymentTransaction = require('./PaymentTransaction');
var OrderPaymentInstrument = function (ID, money) {
    this.paymentTransaction = new PaymentTransaction(money);
    this.ID = ID;
    this.custom = {};
};

OrderPaymentInstrument.prototype = new _super();

OrderPaymentInstrument.prototype.setTestCustomProp = function (key, value) { this.custom[key] = value; };
OrderPaymentInstrument.prototype.clearAllTestCustomProps = function () { this.custom = {}; };
OrderPaymentInstrument.prototype.getCreditCardNumber = function () {};
OrderPaymentInstrument.prototype.getBankAccountNumber = function () {};
OrderPaymentInstrument.prototype.getBankAccountDriversLicense = function () {};
OrderPaymentInstrument.prototype.getPaymentTransaction = function () { return this.paymentTransaction; };
OrderPaymentInstrument.prototype.getCapturedAmount = function () {};
OrderPaymentInstrument.prototype.getRefundedAmount = function () {};
OrderPaymentInstrument.prototype.isPermanentlyMasked = function () {};
OrderPaymentInstrument.prototype.creditCardNumber = null;
OrderPaymentInstrument.prototype.bankAccountNumber = null;
OrderPaymentInstrument.prototype.bankAccountDriversLicense = null;
OrderPaymentInstrument.prototype.paymentTransaction = null;
OrderPaymentInstrument.prototype.capturedAmount = null;
OrderPaymentInstrument.prototype.refundedAmount = null;

module.exports = OrderPaymentInstrument;
