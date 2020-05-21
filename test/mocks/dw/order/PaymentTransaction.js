
var PaymentTransaction = function (amount) {
    this.amount = amount;
};

PaymentTransaction.prototype.getType = function () {};
PaymentTransaction.prototype.getAmount = function () { return this.amount; };
PaymentTransaction.prototype.getPaymentInstrument = function () {};
PaymentTransaction.prototype.getTransactionID = function () {};
PaymentTransaction.prototype.setTransactionID = function () {};
PaymentTransaction.prototype.setPaymentProcessor = function (pp) { this.paymentProcessor = pp; };
PaymentTransaction.prototype.setAmount = function () {};
PaymentTransaction.prototype.getPaymentProcessor = function () {};
PaymentTransaction.prototype.setType = function () {};
PaymentTransaction.prototype.type = null;
PaymentTransaction.prototype.amount = null;
PaymentTransaction.prototype.paymentInstrument = null;
PaymentTransaction.prototype.transactionID = null;
PaymentTransaction.prototype.paymentProcessor = null;

module.exports = PaymentTransaction;
