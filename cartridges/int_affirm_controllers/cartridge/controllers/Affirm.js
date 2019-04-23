'use strict';

/**
 * Controller that renders the home page.
 * 
 * @module controllers/Affirm
 */
var AFFIRM_PAYMENT_METHOD = 'Affirm';
var Resource = require('dw/web/Resource');
var app = require(Resource.msg('affirm.controllers.cartridge','affirm','app_storefront_controllers') + '/cartridge/scripts/app');
var guard = require(Resource.msg('affirm.controllers.cartridge','affirm','app_storefront_controllers') + '/cartridge/scripts/guard');
var BasketMgr = require('dw/order/BasketMgr');
var ISML = require('dw/template/ISML');
var affirm = require('int_affirm/cartridge/scripts/affirm.ds');
var parametersMap = request.httpParameterMap;
var CurrentForms = session.getForms();
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var Order = require('dw/order/Order');

/*
 * Export the publicly available controller methods
 */

function checkCart(cart) {
	var basket = 'object' in cart ? cart.object : cart;
	var selectedPaymentMethod = CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value;
	if (!affirm.data.getAffirmOnlineStatus() || selectedPaymentMethod != AFFIRM_PAYMENT_METHOD){
		return {
			status: new Status(Status.OK),
			authResponse: null
		};
	}
	if (affirm.data.getAffirmVCNStatus() == 'on'){
		if (basket.totalGrossPrice.value != session.custom.affirmTotal || basket.giftCertificateTotalPrice.value > 0){
			return {
				status:{
					error: true,
					PlaceOrderError: new Status(Status.ERROR, 'basket.changed.error')
				}
			};
		} else {
			return {
				status:{
					error: false
				}
			};
		}
	} else {
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
		session.custom.affirmResponseID = affirmResponse.response.id;
		session.custom.affirmFirstEventID = affirmResponse.response.events[0].id;
		session.custom.affirmAmount = affirmResponse.response.amount;
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
		}
		return {
			status:{
				error: affirmStatus.error,
				PlaceOrderError: new Status(Status.ERROR, 'basket.changed.error')
			}
		};
	}
}

function postProcess(order){
	var logger = require('dw/system').Logger.getLogger('Affirm', '');
	if (affirm.data.getAffirmVCNStatus() != 'on'){
		if (affirm.data.getAffirmPaymentAction() == 'CAPTURE'){
			try {
				Transaction.wrap(function(){
					affirm.order.captureOrder(order.custom.AffirmExternalId);
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

function redirect() {
	if (CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value.equals(AFFIRM_PAYMENT_METHOD) && affirm.data.getAffirmVCNStatus() != 'on') {
		var basket = BasketMgr.getCurrentBasket();
		ISML.renderTemplate('affirm/affirmcheckout', {
			Basket : basket
		});
		return true;
	} else {
		return false;
	}
}

function init(basket, applicablePaymentMethods) {
	return affirm.basket.validatePayments(basket, applicablePaymentMethods);
}

/**
 * Handle successful response from Affirm
 */
function success() {
	var placeOrderResult = app.getController('COPlaceOrder').Start();
	if (placeOrderResult.error) {
		app.getController('COSummary').Start({
			PlaceOrderError : new Status(Status.ERROR, 'basket.changed.error')
		});
	} else if (placeOrderResult.order_created) {
		app.getController('COSummary').ShowConfirmation(placeOrderResult.Order);
	}
}

function updateBasket(){
	if (!dw.web.CSRFProtection.validateRequest()){
		response.writer.print(JSON.stringify({error: true}));
		return;
	}
	var hookName = "dw.int_affirm.payment_instrument." + affirm.data.VCNPaymentInstrument();
	var basket = BasketMgr.getCurrentBasket();
	var cart = app.getModel('Cart').get(basket);
	response.setContentType('application/json');
	Transaction.wrap(function(){
		cart.removeExistingPaymentInstruments(AFFIRM_PAYMENT_METHOD);
	});
	if (dw.system.HookMgr.hasHook(hookName)){
		var paymentInstrument = dw.system.HookMgr.callHook(hookName, "add", basket);
		if (!paymentInstrument){
			response.writer.print(JSON.stringify({error: true}));
			return;
		} else {
			Transaction.wrap(function(){
				paymentInstrument.custom.affirmed = true;
			});
		}
	} else {
		response.writer.print(JSON.stringify({error: true}));
		return;
	}
	
	response.writer.print(JSON.stringify({error: false}));
}


function addTrackOrderConfirm (){
	var orderId = request.httpParameterMap.orderId.value || false;
	if (orderId){
		var obj = affirm.order.trackOrderConfirmed(orderId);
		ISML.renderTemplate('order/trackingscript', {
			affirmOnlineAndAnalytics: affirm.data.getAnalyticsStatus(),
			orderInfo : JSON.stringify(obj.orderInfo),
			productInfo: JSON.stringify(obj.productInfo)
		});
	}
	return true;
}
/**
 * Checks authentication and synchronization DW Basket and Affirm Basket
 */
exports.CheckCart = checkCart;

/**
 * Redirects customer to affirm's checkout if affirm is enabled and there is no
 * gift certificates in basket
 */

exports.Redirect = redirect;
exports.Success = guard.ensure([ 'get' ], success);
exports.Init = init;
exports.Update = guard.ensure([ 'post' ], updateBasket);
exports.PostProcess = postProcess;
exports.Tracking = guard.ensure([ 'get' ], addTrackOrderConfirm);
