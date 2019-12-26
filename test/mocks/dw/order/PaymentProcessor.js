
var PaymentProcessor = function (id) {
    this.ID = id || 'testPaymentProcessor';
};

PaymentProcessor.prototype.getID = function () {};
PaymentProcessor.prototype.getPreferenceValue = function () {};
PaymentProcessor.prototype.ID = null;
PaymentProcessor.prototype.preferenceValue = null;

module.exports = PaymentProcessor;
