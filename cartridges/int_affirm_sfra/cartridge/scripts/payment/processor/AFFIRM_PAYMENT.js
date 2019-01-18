'use strict';

/**
 * Controller that renders the home page.
 *
 * @module controllers/Affirm
 */

var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var affirmUtils = require('int_affirm/cartridge/scripts/affirm');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');

/*
 * Export the publicly available controller methods
 */

function authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var order = OrderMgr.getOrder(orderNumber);

    if (!paymentInstrument.custom.affirmed && empty(session.custom.affirmResponseID)) {
        return { error: true };
    }
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNumber;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        var affirmResponseObject = {
                'id': session.custom.affirmResponseID,
                'events': [{'id': session.custom.affirmFirstEventID}],
                'amount': session.custom.affirmAmount
        };
        affirmUtils.order.updateAttributes(order, affirmResponseObject, paymentProcessor, paymentInstrument);
    });
    return { authorized: true };
}
function handle() {
    var basket = BasketMgr.getCurrentBasket();
    Transaction.wrap(function () {
        affirmUtils.basket.createPaymentInstrument(basket);
        session.custom.affirmResponseID = '';
        session.custom.affirmFirstEventID = '';
        session.custom.affirmAmount = '';
    });
    return { success: true };
}

exports.Handle = handle;
exports.Authorize = authorize;