"use strict";

/**
 * Shared Affirm order finalization after basket is ready (standard and Express checkout).
 *
 * @module scripts/checkout/affirmOrderFinalize
 */

var affirm = require("*/cartridge/scripts/affirm");
var COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
var checkoutAffirm = require("*/cartridge/scripts/checkout/checkoutAffirm");
var hooksHelper = require("*/cartridge/scripts/helpers/hooks");
var Logger = require("dw/system/Logger").getLogger("affirm", "affirm");
var OrderMgr = require("dw/order/OrderMgr");

var AFFIRM_PAYMENT_METHOD = "Affirm";

/**
 * Sets Affirm PI, authorizes via checkCart, creates order, captures/places, sends confirmation email.
 *
 * @param {Object} params  Finalization inputs
 * @param {dw.order.Basket} params.basket  SFCC basket ready for order creation
 * @param {string} params.checkoutToken  Affirm checkout token from redirect
 * @param {dw.system.Session} params.session  Current session
 * @param {string} params.localeId  Locale for confirmation email
 * @param {boolean} [params.skipSetPayment]  If true, skip setPayment (VCN standard checkout)
 * @param {string} [params.orderCreateFailLogContext]  Log label when createOrder throws
 * @return {Object}  On success { ok: true, order }; on failure { ok: false, mode: 'error'|'cart' }
 */
function finalizeAffirmOrder(params) {
    var basket = params.basket;
    var checkoutToken = params.checkoutToken;
    var session = params.session;
    var localeId = params.localeId;
    var skipSetPayment = params.skipSetPayment === true;
    var logContext = params.orderCreateFailLogContext || "Affirm";

    if (!skipSetPayment) {
        var affirmPaymentResult = affirm.utils.setPayment(
            basket,
            AFFIRM_PAYMENT_METHOD,
            true
        );
        if (affirmPaymentResult.error) {
            return { ok: false, mode: "error" };
        }
    }

    var affirmCheck = checkoutAffirm.checkCart(basket, checkoutToken, session);
    if (affirmCheck.status.error) {
        return { ok: false, mode: "error" };
    }

    var order;
    try {
        order = OrderMgr.createOrder(basket);
    } catch (e) {
        Logger.error(
            "{0}: Order creation not possible for this basket. Error - {1}",
            logContext,
            e
        );
    }

    if (!order) {
        return { ok: false, mode: "cart" };
    }

    var handlePaymentsResult = COHelpers.handlePayments(
        order,
        order.getOrderNo()
    );
    if (handlePaymentsResult.error) {
        return { ok: false, mode: "error" };
    }

    var fraudDetectionStatus = hooksHelper(
        "app.fraud.detection",
        "fraudDetection",
        basket,
        require("*/cartridge/scripts/hooks/fraudDetection").fraudDetection
    );
    var orderPlacementStatus = COHelpers.placeOrder(
        order,
        fraudDetectionStatus
    );
    if (orderPlacementStatus.error) {
        return { ok: false, mode: "error" };
    }

    checkoutAffirm.postProcess(order);
    COHelpers.sendConfirmationEmail(order, localeId);

    return { ok: true, order: order };
}

module.exports = {
    finalizeAffirmOrder: finalizeAffirmOrder
};

