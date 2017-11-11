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
var Cart = require(Resource.msg('affirm.controllers.cartridge','affirm','app_storefront_controllers') + '/cartridge/scripts/models/CartModel');

/*
 * Export the publicly available controller methods
 */

function authorize(args){
	var orderNo = args.OrderNo;
	var paymentInstrument = args.PaymentInstrument;
	var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
	var order = OrderMgr.getOrder(orderNo);

	if (!paymentInstrument.custom.affirmed && empty(session.custom.affirmResponseID)){
		return {error: true};
	}

	Transaction.wrap(function () {
		paymentInstrument.paymentTransaction.transactionID = orderNo;
		paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
		var affirmResponseObject = {
				'id' : session.custom.affirmResponseID,
				'events' : [{'id': session.custom.affirmFirstEventID}],
				'amount': session.custom.affirmAmount
		};
		affirmUtils.order.updateAttributes(order, affirmResponseObject, paymentProcessor, paymentInstrument);
	});

	return {authorized: true};
}

function handle(){
	var basket = BasketMgr.getCurrentBasket();
	Transaction.wrap(function(){
		affirmUtils.basket.createPaymentInstrument(basket);
		session.custom.affirmResponseID = '';
		session.custom.affirmFirstEventID = '';
		session.custom.affirmAmount = '';
	});
	return {success: true};
}

exports.Handle = handle;
exports.Authorize = authorize;