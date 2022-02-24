'use strict';
/**
 * Provides methods for aligning checkout process on Affirm and SFCC sides
 */

var AFFIRM_PAYMENT_METHOD = 'Affirm';
var affirm = require('*/cartridge/scripts/affirm');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');

var affirmCheckout = function () {};

/**
 * Checks if there are Affirm and SFCC baskets aligned
 * @param {dw.order.Basket} basket  SFCC basket object
 * @param {string} checkoutToken token provided as request parameter
 * @param {dw.system.Session} session current session
 * @returns {Object} status;
 */
affirmCheckout.checkCart = function (basket, checkoutToken, session) {
    var currentSession = session;
    var CurrentForms = currentSession.getForms();
    var selectedPaymentMethod = 'Affirm';
    if (!checkoutToken) {	// not using buy now button
        selectedPaymentMethod = CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value;
        if (!affirm.data.getAffirmOnlineStatus() || selectedPaymentMethod != AFFIRM_PAYMENT_METHOD) {
            return {
                status: new Status(Status.OK),
                authResponse: null
            };
        }
    }

    if (affirm.data.getAffirmVCNStatus() == 'on') {
        if (basket.totalGrossPrice.toFormattedString() != currentSession.privacy.affirmTotal || basket.giftCertificateTotalPrice.value > 0) {
            return {
                status: {
                    error: true,
                    PlaceOrderError: new Status(Status.ERROR, 'basket.changed.error')
                }
            };
        }
        return {
            status: {
                error: false
            }
        };
    }

    var affirmResponse = affirm.order.authOrder(checkoutToken);
    currentSession.privacy.affirmResponseID = affirmResponse.response.id;
    currentSession.privacy.affirmFirstEventID = affirmResponse.response.events[0].id;
    currentSession.privacy.affirmFirstEventCreatedAt = affirmResponse.response.events[0].created;
    currentSession.privacy.affirmAmount = affirmResponse.response.amount;
    currentSession.privacy.affirmCurrency = affirmResponse.response.currency;
    if (empty(affirmResponse) || affirmResponse.error) {
        return {
            status: {
                error: true,
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
            }
        };
    }
    var affirmStatus = affirm.basket.syncBasket(basket, affirmResponse.response);
    if (affirmStatus.error) {
        affirm.order.voidOrder(affirmResponse.response.id);
        return {
            status: {
                error: affirmStatus.error,
                PlaceOrderError: new Status(Status.ERROR, 'basket.changed.error')
            }
        };
    }
    return {
        status: new Status(Status.OK),
        authResponse: null
    };
};

/**
 * Changes payment status and completes order
 * @param {dw.order.Order} order SFCC order object
 * @returns {dw.system.Status} status object
 */
affirmCheckout.postProcess = function (order) {
    var currentOrder = order;
    var logger = require('dw/system').Logger.getLogger('Affirm', '');
    if (affirm.data.getAffirmVCNStatus() != 'on') {
        if (affirm.data.getAffirmPaymentAction() == 'CAPTURE') {
            try {
                var _r = affirm.order.captureOrder(currentOrder.custom.AffirmExternalId, currentOrder.orderNo);
                var capturedAmount = parseFloat(_r.response.amount);
                Transaction.wrap(function () {
                    currentOrder.custom.AffirmStatus = 'CAPTURE';
                    currentOrder.custom.AffirmCapturedAmount = capturedAmount;
                    currentOrder.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    currentOrder.setStatus(Order.ORDER_STATUS_COMPLETED);
                });
            } catch (e) {
                affirm.order.voidOrder(currentOrder.custom.AffirmExternalId);
                logger.error('Affirm Capturing error. Details - {0}', e);
                return new Status(Status.ERROR);
            }
        }
    }
    return new Status(Status.OK);
};

module.exports = affirmCheckout;
