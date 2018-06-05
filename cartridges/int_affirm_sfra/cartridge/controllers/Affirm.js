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
var affirm = require('int_affirm_sfra/cartridge/scripts/affirm.ds');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
 
 
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var Order = require('dw/order/Order');
var PaymentMgr = require('dw/order/PaymentMgr');
var affirmHelper = require('int_affirm_sfra/cartridge/scripts/utils/affirmHelper');
var OrderModel = require('*/cartridge/models/order');


/**
 * Handle successful response from Affirm
 */
server.get('Success', function(req, res, next) {
	// Creates a new order.
	var currentBasket = BasketMgr.getCurrentBasket();
	
	var affirmCheck = affirmHelper.CheckCart(currentBasket);
	
	if (affirmCheck.status.error){
    	res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });
        return next();
    }
	
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }
    
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }
    
    var orderPlacementStatus = COHelpers.placeOrder(order);

    if (orderPlacementStatus.error) {
        return next(new Error('Could not place order'));
    }
    
    affirmHelper.PostProcess(order);
    
    COHelpers.sendConfirmationEmail(order, req.locale.id);
    
    var config = {
            numberOfLineItems: '*'
        };
        var orderModel = new OrderModel(order, { config: config });
        if (!req.currentCustomer.profile) {
            var passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true
            });
        }
        return next();
});

server.post('Update', function(req, res, next){
	if (!dw.web.CSRFProtection.validateRequest()){
		res.json({error: true});
		return next();
	}
	var hookName = "dw.int_affirm_sfra.payment_instrument." + affirm.data.VCNPaymentInstrument().toLowerCase();
	var basket = BasketMgr.getCurrentBasket();
	var paymentMethodAffirm = PaymentMgr.getPaymentMethod(AFFIRM_PAYMENT_METHOD);
	res.setContentType('application/json');
    // TODO: Maybe will need fix for removing payment instrument
	Transaction.wrap(function(){
		//basket.removePaymentInstrument(paymentMethodAffirm);
	});
	if (dw.system.HookMgr.hasHook(hookName)){
		var paymentInstrument = dw.system.HookMgr.callHook(hookName, "add", basket);
		if (!paymentInstrument){
			res.json({error: true});
			return next();
		} else {
			Transaction.wrap(function(){
				paymentInstrument.custom.affirmed = true;
			});
		} 
	} else {
		res.json({error: true});
		return next();
	};

	res.json({error: false});
	return next();
});


server.get('CheckoutObject', function(req, res, next){
	var basket = BasketMgr.getCurrentBasket();
	if (!basket){
		res.json();
		return next();
	}
	else if (basket.getAllProductLineItems().isEmpty()){
		res.json();
		return next();
	}
	var affirmTotal = basket.totalGrossPrice.value;
	var vcndata = affirm.basket.getCheckout(basket);
	var enabled = affirm.data.getAffirmVCNStatus() == 'on'?true:false;
	var affirmselected = true;
	var errormessages = affirm.data.getErrorMessages();

	res.json({
		affirmTotal:affirmTotal,
		vcndata:vcndata,
		enabled:enabled,
		affirmselected:affirmselected,
		errormessages:errormessages
	});
    next();
});

/**
 * Checks authentication and synchronization DW Basket and Affirm Basket
 */

/**
 * Redirects customer to affirm's checkout if affirm is enabled and there is no
 * gift certificates in basket
 */


module.exports = server.exports();

