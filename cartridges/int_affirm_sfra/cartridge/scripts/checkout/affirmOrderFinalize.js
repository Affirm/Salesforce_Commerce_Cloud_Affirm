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
var Logger = require("dw/system/Logger").getLogger("Affirm", "affirmOrderFinalize");
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

    Logger.debug("{0}: finalizeAffirmOrder started - skipSetPayment={1}, checkoutToken={2}",
        logContext, skipSetPayment, checkoutToken);

    if (!skipSetPayment) {
        Logger.debug("{0}: Setting payment instrument", logContext);
        var affirmPaymentResult = affirm.utils.setPayment(
            basket,
            AFFIRM_PAYMENT_METHOD,
            true
        );
        if (affirmPaymentResult.error) {
            Logger.error("{0}: setPayment failed", logContext);
            return { ok: false, mode: "error" };
        }
        Logger.debug("{0}: Payment instrument set successfully", logContext);
    }

    Logger.debug("{0}: Calling checkCart", logContext);
    var affirmCheck = checkoutAffirm.checkCart(basket, checkoutToken, session);
    Logger.debug("{0}: checkCart returned - status.error={1}", logContext, affirmCheck.status.error);
    if (affirmCheck.status.error) {
        return { ok: false, mode: "error" };
    }

    var order;
    try {
        Logger.debug("{0}: Creating order from basket - totalGrossPrice={1}, customerEmail={2}",
            logContext, basket.totalGrossPrice, basket.customerEmail);
        order = OrderMgr.createOrder(basket);
    } catch (e) {
        Logger.error(
            "{0}: Order creation not possible for this basket. Error - {1}",
            logContext,
            e
        );
    }

    if (!order) {
        Logger.error("{0}: Order is null after createOrder", logContext);
        return { ok: false, mode: "cart" };
    }
    Logger.debug("{0}: Order created - orderNo={1}", logContext, order.orderNo);

    Logger.debug("{0}: Calling handlePayments", logContext);
    var handlePaymentsResult = COHelpers.handlePayments(
        order,
        order.getOrderNo()
    );
    if (handlePaymentsResult.error) {
        Logger.error("{0}: handlePayments failed", logContext);
        return { ok: false, mode: "error" };
    }
    Logger.debug("{0}: handlePayments succeeded", logContext);

    Logger.debug("{0}: Running fraud detection", logContext);
    var fraudDetectionStatus = hooksHelper(
        "app.fraud.detection",
        "fraudDetection",
        basket,
        require("*/cartridge/scripts/hooks/fraudDetection").fraudDetection
    );
    Logger.debug("{0}: Placing order", logContext);
    var orderPlacementStatus = COHelpers.placeOrder(
        order,
        fraudDetectionStatus
    );
    if (orderPlacementStatus.error) {
        Logger.error("{0}: placeOrder failed", logContext);
        return { ok: false, mode: "error" };
    }
    Logger.debug("{0}: Order placed successfully", logContext);

    Logger.debug("{0}: Running postProcess", logContext);
    checkoutAffirm.postProcess(order);

    Logger.debug("{0}: Sending confirmation email", logContext);
    COHelpers.sendConfirmationEmail(order, localeId);

    Logger.debug("{0}: finalizeAffirmOrder complete", logContext);

    return { ok: true, order: order };
}

module.exports = {
    finalizeAffirmOrder: finalizeAffirmOrder
};

