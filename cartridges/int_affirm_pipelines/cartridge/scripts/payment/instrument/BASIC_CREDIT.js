'use strict';

var Resource = require('dw/web/Resource');
var parametersMap = request.httpParameterMap;
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Money = require('dw/value/Money');

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
    var PIs = basket.getPaymentInstruments();
    var paymentInstrument;
    Transaction.wrap(function () {
    	if (!empty(PIs)) {
    		basket.removePaymentInstrument(PIs[0]);
    	}
        paymentInstrument = basket.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD, getNonGiftCertificateAmount(basket));

        paymentInstrument.creditCardHolder = cardHolder;
        paymentInstrument.creditCardNumber = cardNumber;
        paymentInstrument.creditCardType = cardType;
        paymentInstrument.creditCardExpirationMonth = expirationMonth;
        paymentInstrument.creditCardExpirationYear = expirationYear;
    });

    return paymentInstrument;
};

/**
 * @param {dw.order.Basket} basket basket to be updated
 * @returns {dw.value.Money} modney
 */
function getNonGiftCertificateAmount(basket) {
    // The total redemption amount of all gift certificate payment instruments in the basket.
    var giftCertTotal = new Money(0.0, basket.getCurrencyCode());
    // Gets the list of all gift certificate payment instruments
    var gcPaymentInstrs = basket.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;
    // Sums the total redemption amount.
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }
    // Gets the order total.
    var orderTotal = basket.getTotalGrossPrice();
    // Calculates the amount to charge for the payment instrument.
    // This is the remaining open order total that must be paid.
    var amountOpen = orderTotal.subtract(giftCertTotal);
    // Returns the open amount to be paid.
    return amountOpen;
}
