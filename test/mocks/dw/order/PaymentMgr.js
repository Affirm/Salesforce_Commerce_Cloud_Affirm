var PaymentMethod = require('./PaymentMethod');
var PaymentCard = require('./PaymentCard');
var Iterator = require('../util/Iterator');

var PaymentMgr = function () {};

PaymentMgr.getPaymentMethod = function (method) {
    if (!method) throw new Error('Invalid method argument');
    if (typeof method === 'object') {
        return new PaymentMethod(method.ID);
    }
    return new PaymentMethod(method);
};

var paymentMethods = {
    testUser: [new PaymentMethod('TestPaymentMethod')]
};
PaymentMgr.getApplicablePaymentMethods = function (user) {
    if (!user) throw new Error('Invalid user argument');
    var result;
    if (typeof user === 'object') {
        result = paymentMethods[user.ID];
    } else {
        result = paymentMethods[user];
    }
    result.iterator = function () { return new Iterator(this); };
    return result;
};
PaymentMgr.getPaymentCard = function (cardType) { return new PaymentCard(cardType); };
PaymentMgr.getActivePaymentMethods = function () {};
PaymentMgr.prototype.paymentMethod = null;
PaymentMgr.prototype.applicablePaymentMethods = null;
PaymentMgr.prototype.paymentCard = null;
PaymentMgr.prototype.activePaymentMethods = null;

module.exports = PaymentMgr;
