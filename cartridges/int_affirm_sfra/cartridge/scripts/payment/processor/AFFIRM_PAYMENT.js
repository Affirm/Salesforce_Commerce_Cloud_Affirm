'use strict';

/**
 * Controller that renders the home page.
 *
 * @module controllers/Affirm
 */

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var affirmUtils = require('*/cartridge/scripts/affirm');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * Export the publicly available controller methods
 * @param {string} orderNumber order number
 * @param {dw.order.paymentInstrument} paymentInstrument to be authorized
 * @param {dw.order.paymentProcessor} paymentProcessor to be delegated to payment instrument
 * @returns {Object} object with error/authorization status
 */
function authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var order = OrderMgr.getOrder(orderNumber);

    if (!paymentInstrument.custom.affirmed && empty(session.privacy.affirmResponseID)) {
        return { error: true };
    }
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNumber;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        var affirmResponseObject = {
            id: session.privacy.affirmResponseID,
            events: [{ id: session.privacy.affirmFirstEventID }],
            amount: session.privacy.affirmAmount
        };
        affirmUtils.order.updateAttributes(order, affirmResponseObject, paymentProcessor, paymentInstrument);
    });
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

/**
 * Creates affirm payment method and sets session custom data
 * @returns {Object} status object
 */
function handle() {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var basket = BasketMgr.getCurrentBasket();
    Transaction.wrap(function () {
        affirmUtils.basket.createPaymentInstrument(basket);
        session.privacy.affirmResponseID = '';
        session.privacy.affirmFirstEventID = '';
        session.privacy.affirmAmount = '';
    });
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = handle;
exports.Authorize = authorize;
