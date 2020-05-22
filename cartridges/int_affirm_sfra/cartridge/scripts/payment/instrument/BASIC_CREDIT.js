'use strict';

var Resource = require('dw/web/Resource');
var parametersMap = request.httpParameterMap;
var affirmHelper = require('*/cartridge/scripts/utils/affirmHelper');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');

/**
 * Method add of this hook implements replacement for default affirm payment method
 * @param {dw.order.Basket} basket basket to be updated
 * @returns {dw.order.OrderPaymentInstrument} added payment instrument
 */
exports.add = function (basket) {
    var billingAddress = basket.getBillingAddress();
    if (billingAddress) {
        Transaction.wrap(function () {
            billingAddress.setCity(parametersMap['billing_address[city]'].stringValue);
            billingAddress.setAddress1(parametersMap['billing_address[line1]'].stringValue);
            billingAddress.setAddress2(parametersMap['billing_address[line2]'].stringValue);
            billingAddress.setStateCode(parametersMap['billing_address[state]'].stringValue);
            billingAddress.setPostalCode(parametersMap['billing_address[zipcode]'].stringValue);
        });
    }
    var cardNumber = parametersMap.number.stringValue;
    var cardHolder = parametersMap.cardholder_name.stringValue;
    var cardSecurityCode = parametersMap.cvv.stringValue;
    var cardType = 'Visa';
    var expirationMonth = parametersMap.expiration.stringValue.substr(0, 2);
    var expirationYear = '20' + parametersMap.expiration.stringValue.substr(2, 2);
    var paymentCard = PaymentMgr.getPaymentCard(cardType);
    var creditCardStatus = paymentCard.verify(expirationMonth, expirationYear, cardNumber, cardSecurityCode);
    if (creditCardStatus.error) {
        return null;
    }
    var paymentInstrument;
    var paymentInstruments = basket.getPaymentInstruments();
    Transaction.wrap(function () {
        var paymentIterator = paymentInstruments.iterator();
        while (paymentIterator.hasNext()) {
            var pi = paymentIterator.next();
            basket.removePaymentInstrument(pi);
        }
        paymentInstrument = basket.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD, affirmHelper.getNonGiftCertificateAmount(basket));
        paymentInstrument.creditCardHolder = cardHolder;
        paymentInstrument.creditCardNumber = cardNumber;
        paymentInstrument.creditCardType = cardType;
        paymentInstrument.creditCardExpirationMonth = expirationMonth;
        paymentInstrument.creditCardExpirationYear = expirationYear;
    });
    return paymentInstrument;
};
