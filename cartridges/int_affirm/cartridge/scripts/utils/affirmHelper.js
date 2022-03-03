'use strict';

/**
 * Controller that renders the home page.
 *
 * @module controllers/Affirm
 */
var AFFIRM_PAYMENT_METHOD = 'Affirm';
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var ISML = require('dw/template/ISML');
var affirm = require('*/cartridge/scripts/affirm');

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var PaymentMgr = require('dw/order/PaymentMgr');
var parametersMap = request.httpParameterMap;
var Money = require('dw/value/Money');

/**
 * Export the publicly available controller methods
 * @param {dw.order.Basket} cart SFCC basket
 * @param {bookean} sfraFlag if method was called by sfra controller
 * @returns {Object} status object
 */
function checkCart(cart, sfraFlag) {
    var basket = 'object' in cart ? cart.object : cart;
    var paymentInstruments = basket.getPaymentInstruments().toArray();
    if (paymentInstruments.length === 0){
        return {
            status:{
                error: true
            }
        }
    }
    var selectedPaymentMethod = paymentInstruments[0].paymentMethod;
    if (!affirm.data.getAffirmOnlineStatus() || selectedPaymentMethod != 'Affirm'){
        return {
            status: new Status(Status.OK),
            authResponse: null
        };
    }
    if (affirm.data.getAffirmVCNStatus() == 'on'){
        var customTotal = sfraFlag ? basket.totalGrossPrice.toFormattedString() : basket.totalGrossPrice.value;
        if (customTotal != session.privacy.affirmTotal || basket.giftCertificateTotalPrice.value > 0){
            return {
                status:{
                    error: true,
                    PlaceOrderError: new Status(Status.ERROR, 'basket.changed.error')
                }
            };
        } 
        return {
            status:{
                error: false
            }
        };
		
    } 
    var test = parametersMap;
    var token = parametersMap.checkout_token.stringValue;
    if (empty(token)) {
        return {
            status:{
                error: true,
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
            }
        };
    }
    var affirmResponse = affirm.order.authOrder(token);
    session.privacy.affirmResponseID = affirmResponse.response.id;
    session.privacy.affirmFirstEventID = affirmResponse.response.events[0].id;
    session.privacy.affirmFirstEventCreatedAt = affirmResponse.response.events[0].created;
    session.privacy.affirmAmount = affirmResponse.response.amount;
    session.privacy.affirmCurrency = affirmResponse.response.currency;

    if (empty(affirmResponse) || affirmResponse.error){
        return {
            status:{
                error: true,
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
            }
        };
    }
    var affirmStatus = affirm.basket.syncBasket(basket, affirmResponse.response);
    if (affirmStatus.error){
        affirm.order.voidOrder(affirmResponse.response.id);
        return {
    			status:{
    				error: affirmStatus.error,
    				PlaceOrderError: new Status(Status.ERROR, 'basket.changed.error')
    			}
    		};
    } 
    return {
        status: {
            error: false
        }
    }
        
		
	
}

/**
 * @param {dw.order.Order} order SFCC order
 * @returns {dw.system.Status} status object
 */
function postProcess(order) {
    var logger = require('dw/system').Logger.getLogger('Affirm', '');
    if (affirm.data.getAffirmVCNStatus() != 'on') {
        if (affirm.data.getAffirmPaymentAction() == 'CAPTURE') {
            try {
                Transaction.wrap(function () {
                    affirm.order.captureOrder(order.custom.AffirmExternalId, order.orderNo);
                    order.custom.AffirmStatus = 'CAPTURE';
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    order.setStatus(Order.ORDER_STATUS_COMPLETED);
                });
            } catch (e) {
                affirm.order.voidOrder(order.custom.AffirmExternalId);
                logger.error('Affirm Capturing error. Details - {0}', e);
                return new Status(Status.ERROR);
            }
        }
    }
    return new Status(Status.OK);
}

/**
 * @returns {boolean} result status 
 */
function redirect() {
    if (server.forms.getForm('billing').paymentMethod == AFFIRM_PAYMENT_METHOD && affirm.data.getAffirmVCNStatus() != 'on') {
        var basket = BasketMgr.getCurrentBasket();

        res.render('affirm/affirmCheckoutMF', {
            Basket: basket
        });
		 return true;
    }
    return false;
}

/**
 * Export the publicly available controller methods
 * @param {dw.order.Basket} basket SFCC basket
 * @param {dw.utils.Collection} applicablePaymentMethods applicable methods for provided basket
 * @returns {Object} simple object contained product data
 */
function init(basket, applicablePaymentMethods) {
    return affirm.basket.validatePayments(basket, applicablePaymentMethods);
}

/**
 * Check if Affirm payment method can be applicable for checkout
 * @returns {boolean} result status 
 */
function isAffirmApplicable() {
    var basket = BasketMgr.getCurrentBasket();
    if (!basket.getGiftCertificateLineItems().empty || !affirm.data.getAffirmOnlineStatus() || affirm.data.getAffirmPaymentOnlineStatus() || !affirm.utils.checkBasketTotalRange('object' in basket ? basket.object : basket)) {
        return false;
    }

    return true;
}


/**
 * extension for SFRA from controllers cart model
 * @param {dw.order.Basket} cart SFCC basket
 * @returns {dw.value.Money} open amount to be paid
 */
function getNonGiftCertificateAmount(cart) {
    // The total redemption amount of all gift certificate payment instruments in the basket.
    var giftCertTotal = new Money(0.0, cart.getCurrencyCode());

    // Gets the list of all gift certificate payment instruments
    var gcPaymentInstrs = cart.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;

    // Sums the total redemption amount.
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    // Gets the order total.
    var orderTotal = cart.getTotalGrossPrice();

    // Calculates the amount to charge for the payment instrument.
    // This is the remaining open order total that must be paid.
    var amountOpen = orderTotal.subtract(giftCertTotal);

    // Returns the open amount to be paid.
    return amountOpen;
}


/**
 * Redirects customer to affirm's checkout if affirm is enabled and there is no
 * gift certificates in basket
 */

module.exports = {
    Redirect: redirect,
    Init: init,
    CheckCart: checkCart,
    PostProcess: postProcess,
    IsAffirmApplicable: isAffirmApplicable,
    getNonGiftCertificateAmount: getNonGiftCertificateAmount,
    AFFIRM_PAYMENT_METHOD: AFFIRM_PAYMENT_METHOD
};
