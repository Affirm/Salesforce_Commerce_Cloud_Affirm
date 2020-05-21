'use strict';
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var array = require('*/cartridge/scripts/util/array');

    var viewData = viewFormData;
    var currentBasket = BasketMgr.getCurrentBasket();

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    if (req.form.storedPaymentUUID) {
        viewData.storedPaymentUUID = req.form.storedPaymentUUID;
    }

    // process payment information
    if (viewData.storedPaymentUUID
        && req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
    ) {
        var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
        var paymentInstrument = array.find(paymentInstruments, function (item) {
            return viewData.storedPaymentUUID === item.UUID;
        });
    }

    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        req.currentCustomer.raw,
        req.geolocation.countryCode,
        null
    );

    var cardType = applicablePaymentCards ? applicablePaymentCards[0].name : '';

    viewData.paymentInformation = {
        cardType: {
            value: cardType
        }
    };

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {

}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
