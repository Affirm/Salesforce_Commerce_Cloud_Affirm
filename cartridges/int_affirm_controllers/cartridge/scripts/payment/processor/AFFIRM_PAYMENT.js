'use strict';

/**
 * Controller that renders the home page.
 *
 * @module controllers/Affirm
 */

var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var affirm = require('*/cartridge/scripts/affirm');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * Export the publicly available controller methods
 * @param {Object} args object containing order number and PaymentInstrument
 * @returns {Object} object with error/authorization status
 */
function authorize(args) {
    var orderNo = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
    var order = OrderMgr.getOrder(orderNo);

    if (!paymentInstrument.custom.affirmed && empty(session.privacy.affirmResponseID)) {
        return { error: true };
    }

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        var affirmResponseObject = {
            id: session.privacy.affirmResponseID,
            events: [{ id: session.privacy.affirmFirstEventID }],
            amount: session.privacy.affirmAmount
        };
        affirm.order.updateAttributes(order, affirmResponseObject, paymentProcessor, paymentInstrument);
    });

    return { authorized: true };
}

/**
 * Creates affirm payment method and sets session custom data
 * @returns {Object} object with error/authorization status
 */
function handle() {
    var basket = BasketMgr.getCurrentBasket();
    Transaction.wrap(function () {
        affirm.basket.createPaymentInstrument(basket);
        session.privacy.affirmResponseID = '';
        session.privacy.affirmFirstEventID = '';
        session.privacy.affirmAmount = '';
    });
    return { success: true };
}

exports.Handle = handle;
exports.Authorize = authorize;
