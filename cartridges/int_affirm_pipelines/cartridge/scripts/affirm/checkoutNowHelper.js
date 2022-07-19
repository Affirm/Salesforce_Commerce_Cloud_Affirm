'use strict';

/**
 * Controller that renders the home page.
 *
 * @module controllers/Affirm
 */
var AFFIRM_PAYMENT_METHOD = 'Affirm';
var app = {};
var BasketMgr = require('dw/order/BasketMgr');
var ISML = require('dw/template/ISML');
var affirm = require('*/cartridge/scripts/affirm');
var parametersMap = request.httpParameterMap;
var CurrentForms = session.getForms();
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var Order = require('dw/order/Order');
var ProductMgr = require('dw/catalog/ProductMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var Response = require('dw/system/Response');
var URLUtils = require('dw/web/URLUtils');
var HookMgr = require('dw/system/HookMgr');
var currentSite = require('dw/system/Site').getCurrent();


/**
 *
 * @param {Object} payload content that will be provided as stringified json
 * @param {boolean} ifSuccess if response is successful or it's an error
 * @returns {Object} adapted object
 */
function responseAdaptedToPipelines(payload, ifSuccess) {
    return {
        body: payload,
        success: ifSuccess
    }
}

/**
 * Checks if there are Affirm and SFCC baskets aligned
 * @param {Object} cart basket object
 * @param {string} checkoutToken token provided as request parameter
 * @returns {Object} status;
 */
function checkCart(cart, checkoutToken) {
    var basket = 'object' in cart ? cart.object : cart;
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
        if (basket.totalGrossPrice.value != session.privacy.affirmTotal || basket.giftCertificateTotalPrice.value > 0) {
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
    var token = checkoutToken ? checkoutToken : parametersMap.checkout_token.stringValue;
    if (empty(token)) {
        return {
            status: {
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
    }
    return {
        status: {
            error: affirmStatus.error,
            PlaceOrderError: new Status(Status.ERROR, 'basket.changed.error')
        }
    };
}

/**
 * Changes payment status and completes order
 * @param {dw.order.Order} order SFCC order object
 * @returns {dw.system.Status} status object
 */
function postProcess(order) {
    var logger = require('dw/system').Logger.getLogger('Affirm', '');
    if (affirm.data.getAffirmVCNStatus() != 'on') {
        if (affirm.data.getAffirmPaymentAction() == 'CAPTURE') {
            try {
                var _r = affirm.order.captureOrder(order.custom.AffirmExternalId, order.orderNo);
                var capturedAmount = parseFloat(_r.response.amount);
                Transaction.wrap(function () {
                    order.custom.AffirmStatus = 'CAPTURE';
                    order.custom.AffirmCapturedAmount = capturedAmount;
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
 * Redirects ot affirmCheckoutTemplate
 * @returns {boolean} result
 */
function redirect() {
    if (CurrentForms.billing.paymentMethods.selectedPaymentMethodID.value.equals(AFFIRM_PAYMENT_METHOD) && affirm.data.getAffirmVCNStatus() != 'on') {
        var basket = BasketMgr.getCurrentBasket();
        ISML.renderTemplate('affirm/affirmcheckout', {
            Basket: basket,
            sgControllersFlag: false
        });
        return true;
    }
    return false;
}

/**
 * @param {dw.order.Basket} basket  SFCC basket object
 * @param {Array} applicablePaymentMethods applicable payment methods
 * @returns {Object} status;
 */
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
            PlaceOrderError: new Status(Status.ERROR, 'basket.changed.error')
        });
    } else if (placeOrderResult.order_created) {
        app.getController('COSummary').ShowConfirmation(placeOrderResult.Order);
    }
}

/**
 * Replaces affirm payment method in basket by vcn
 * @returns {Object} object adapted for further pipelines handling
 */
function updateBasket() {
    if (!dw.web.CSRFProtection.validateRequest() && !parametersMap.vcnUpdate.value) {
        return responseAdaptedToPipelines({error: true}, false);
    }
    var hookName = 'dw.int_affirm.payment_instrument.' + affirm.data.VCNPaymentInstrument();
    var basket = BasketMgr.getCurrentBasket();

    Transaction.wrap(function () {
        var iter = basket.getPaymentInstruments(AFFIRM_PAYMENT_METHOD).iterator();
        while (iter.hasNext()) {
            basket.removePaymentInstrument(iter.next());
        }
    });
    if (dw.system.HookMgr.hasHook(hookName)) {
        var paymentInstrument = dw.system.HookMgr.callHook(hookName, 'add', basket);
        if (!paymentInstrument) {
            return responseAdaptedToPipelines({error: true}, false);
        }
        Transaction.wrap(function () {
            paymentInstrument.custom.affirmed = true;
        });
    } else {
        return responseAdaptedToPipelines({error: true}, false);
    }
    session.privacy.affirmTotal = basket.totalGrossPrice.value;	// VCN check
    return responseAdaptedToPipelines({error: false}, true);
}

/**
 * Tracks successfull order
 * @returns {boolean} status
 */
function addTrackOrderConfirm() {
    var orderId = request.httpParameterMap.orderId.value || false;
    if (orderId) {
        var obj = affirm.order.trackOrderConfirmed(orderId);
        ISML.renderTemplate('order/trackingscript', {
            affirmOnlineAndAnalytics: affirm.data.getAnalyticsStatus(),
            orderInfo: JSON.stringify(obj.orderInfo),
            productInfo: JSON.stringify(obj.productInfo)
        });
    }
    return true;
}

/**
 * Renders express checkout button
 */
function renderCheckoutNow() {

    if (!affirm.data.getAffirmExpressCheckoutStatus()) { return;}
    var productId = request.httpParameterMap.productId.value || false;
    // if express checkout started for specific product ID (e.g. from PDP), existing cart needs to be cleaned up beforehand
    var isCartResetNeeded = productId !== false;
    var currencyCode = session.currency.currencyCode;
    var checkoutItemObject = affirm.utils.getCheckoutItemsObject(productId, currencyCode);
    ISML.renderTemplate('affirm/checkoutNowButton', {
        checkoutItemObject : checkoutItemObject,
        httpProtocol: request.getHttpProtocol(),
        version: 'controllers',
        isCartResetNeeded: isCartResetNeeded,
        paymentLimits: {
            min: affirm.data.getAffirmPaymentMinTotal(),
            max: affirm.data.getAffirmPaymentMaxTotal()
        },
        sgControllersFlag: false
    });
}

/**
 * Sets response headers
 */
function prepareResponse() {
    response.addHttpHeader(Response.ACCESS_CONTROL_ALLOW_ORIGIN, 'http://' + currentSite.getHttpsHostName());
    response.addHttpHeader(Response.ACCESS_CONTROL_ALLOW_METHODS, 'POST');
    response.addHttpHeader(Response.ACCESS_CONTROL_ALLOW_CREDENTIALS, 'true');
    response.addHttpHeader(Response.ACCESS_CONTROL_ALLOW_HEADERS, 'content-type');
}

/**
 * Creates new order based on request from Affirm
 * @returns {Object} object adapted for further pipelines handling
 */
function createOrder() {
    if (request.httpMethod == 'OPTIONS') {
        prepareResponse();
        return responseAdaptedToPipelines({}, true)
    } else {
        var parameterMap = request.httpParameterMap;
        var requestObject = JSON.parse(parameterMap.requestBodyAsString);
        var affirmOrderObj = requestObject.data.order;
        var products = affirmOrderObj.items;
        var nameInArray = affirmOrderObj.shipping.full_name.split(" ");
        var firstName = nameInArray.shift();
        var lastName = nameInArray.join(" ");
        var addressObj = {
            firstName: firstName,
            lastName: lastName,
		    address1: affirmOrderObj.shipping.street1,
		    address2: affirmOrderObj.shipping.street2 || '',
		    countryCode: affirmOrderObj.shipping.country,
		    stateCode: affirmOrderObj.shipping.region1_code,
		    postalCode: affirmOrderObj.shipping.postal_code,
		    city: affirmOrderObj.shipping.city,
		    phone: affirmOrderObj.user.phone_number
        };
        var basket = BasketMgr.getCurrentOrNewBasket();
        affirm.utils.setBillingAddress(basket, addressObj, affirmOrderObj.user);
        if (request.httpParameterMap.reset_cart.booleanValue) {
            basket.getAllProductLineItems().toArray().forEach(function (item) {
                basket.removeProductLineItem(item);
            });
            basket.getCouponLineItems().toArray().forEach(function (item) {
                basket.removeCouponLineItem(item);
            });

            var shipment = basket.defaultShipment;

            Transaction.wrap(function () {
                products.forEach(function(affirmProduct){
                    var sfccProduct = ProductMgr.getProduct(affirmProduct.sku);
                    var optionModel = sfccProduct.getOptionModel();
                    var prodOptions = affirmProduct.options.productOptions || [];
                    prodOptions.forEach(function(opt){
                        var option = optionModel.getOption(opt.optionId);
                        var value = optionModel.getOptionValue(option, opt.selectedValueId);
                        optionModel.setSelectedOptionValue(option, value);
                    });

                    var productLineItem = basket.createProductLineItem(sfccProduct, optionModel, shipment);
                    productLineItem.setQuantityValue(affirmProduct.qty);
                })

                var calculate = require('*/cartridge/scripts/cart/calculate');
                var calculateStatus = calculate.calculate(basket);
            });
        }

        Transaction.wrap(function(){
            basket.custom.AffirmShippingAddress = JSON.stringify(addressObj);
        });

        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(basket.getDefaultShipment())
            .getApplicableShippingMethods(addressObj);
        var currentShippingMethod = basket.getDefaultShipment().getShippingMethod() || ShippingMgr.getDefaultShippingMethod();
        var affirmShippingOptions = affirm.utils.getShippingOptions(addressObj);

        Transaction.wrap(function () {
            affirm.utils.updateShipmentShippingMethod(
                basket.getDefaultShipment().getID(),
                currentShippingMethod.getID(),
                currentShippingMethod,
                applicableShippingMethods);
            HookMgr.callHook('dw.order.calculate', 'calculate', basket);
        });

        prepareResponse();

        var basketTotal = Math.round(basket.totalGrossPrice.value * 100);
        session.privacy.affirmTotal = basket.totalGrossPrice.value;	// VCN check
        var tax = Math.round(basket.totalTax.value * 100);
        var discounts = affirm.basket.collectDiscounts(products, basket) || [];
        var responseObject = {
            'shipping_options': affirmShippingOptions,
            'merchant_internal_order_id': basket.UUID,
            'tax_amount': tax,
            'total_amount': basketTotal,
            'discount_codes': discounts
        };

        return responseAdaptedToPipelines(responseObject, true);
    }
}

/**
 * Updates current basket shipping data based on Affirm request
 * @returns {Object} object adapted for further pipelines handling
 */
function updateShipping() {
    if (request.httpMethod == 'OPTIONS') {
        prepareResponse();
        return responseAdaptedToPipelines({}, true)
    } else {
        var parameterMap = request.httpParameterMap;
        var requestObject = JSON.parse(parameterMap.requestBodyAsString);
        var requestDataOrder = requestObject.data.order;
        var selectedShippingMethodId = requestDataOrder.chosen_shipping_option.merchant_internal_method_code;
        var basket = BasketMgr.getCurrentOrNewBasket();
        var affirmShippingAddress = JSON.parse(basket.custom.AffirmShippingAddress);
        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(basket.getDefaultShipment())
            .getApplicableShippingMethods(affirmShippingAddress);
        var selectedShippingMethod;
        for (var i = 0; i < applicableShippingMethods.length; i++) {
	        var shippingMethod = applicableShippingMethods[i];
	        if (shippingMethod.getID() == selectedShippingMethodId) {
	        	selectedShippingMethod = shippingMethod;
	        	break;
	        }
        }

        Transaction.wrap(function () {
            affirm.utils.updateShipmentShippingMethod(
                basket.getDefaultShipment().getID(),
                selectedShippingMethodId,
                selectedShippingMethod,
                applicableShippingMethods);
            HookMgr.callHook('dw.order.calculate', 'calculate', basket);

            var shipment = basket.getShipments().iterator().next();
	        var shippingAddress = shipment.createShippingAddress();

            shippingAddress.setFirstName( affirmShippingAddress.firstName );
            shippingAddress.setLastName( affirmShippingAddress.lastName );
            shippingAddress.setAddress1( affirmShippingAddress.address1 );
            shippingAddress.setAddress2( affirmShippingAddress.address2 || '' );
            shippingAddress.setCity( affirmShippingAddress.city );
            shippingAddress.setPostalCode( affirmShippingAddress.postalCode );
            shippingAddress.setStateCode( affirmShippingAddress.stateCode );
            shippingAddress.setCountryCode( affirmShippingAddress.countryCode );
            shippingAddress.setPhone( affirmShippingAddress.phone );
        });


        var basketTotal = Math.round(basket.totalGrossPrice.value * 100);
        session.privacy.affirmTotal = basket.totalGrossPrice.value;	// VCN check
        var tax = Math.round(basket.totalTax.value * 100);
        //var affirmOrderObj = requestObject.data.order;
        var responseObject ={
            "tax_amount": tax,
            "total_amount": basketTotal,
            "merchant_internal_order_id": basket.UUID
        };

        prepareResponse();
        return responseAdaptedToPipelines(responseObject, true);
    }
}

/**
 * Handles order payment
 * @param {dw.order.Order} order SFCC order
 * @returns {Object} status object
 */
function handlePayments(order) {
    if (order.getTotalNetPrice() !== 0.00) {
        var paymentInstruments = order.getPaymentInstruments();
        if (paymentInstruments.length === 0) {
            return {
                missingPaymentInfo: true
            };
        }
        /**
         * Sets the transaction ID for the payment instrument.
         */
        var handlePaymentTransaction = function () {
            paymentInstrument.getPaymentTransaction().setTransactionID(order.getOrderNo());
        };
        for (var i = 0; i < paymentInstruments.length; i++) {
            var paymentInstrument = paymentInstruments[i];
            if (PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor() === null) {
                Transaction.wrap(handlePaymentTransaction);
            } else {
                var authorizationResult;
                var processor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
                if (HookMgr.hasHook('app.payment.processor.' + processor.ID)) {
                    authorizationResult = HookMgr.callHook('app.payment.processor.' + processor.ID, 'Authorize', {
                        Order: order,
                        OrderNo: order.getOrderNo(),
                        PaymentInstrument: paymentInstrument
                    });
                } else {
                    authorizationResult = HookMgr.callHook('app.payment.processor.default', 'Authorize', {
                        Order: order,
                        OrderNo: order.getOrderNo(),
                        PaymentInstrument: paymentInstrument
                    });
                }

                if (authorizationResult.not_supported || authorizationResult.error) {
                    return {
                        error: true
                    };
                }
            }
        }
    }
    return {};
}

/**
 * Handles successfull affirm response
 * @returns {Object} status object
 */
function confirmation() {
    var checkoutToken = request.httpParameterMap.checkout_token.value;
    var orderPlacementStatus = {error: false};
    try {
        return Transaction.wrap(function () {
	        var OrderMgr = require('dw/order/OrderMgr');
	        var basket = BasketMgr.getCurrentOrNewBasket();
	        if (affirm.data.getAffirmVCNStatus() != 'on') {
	        	affirm.utils.setPayment(basket, AFFIRM_PAYMENT_METHOD);
	        }
            var affirmCheck = checkCart(basket, checkoutToken);
	        if (affirmCheck.status.error){
	            return responseAdaptedToPipelines({
	                error: true,
	                PlaceOrderError: affirmCheck.status
	            }, false);
	        }
	        var order = OrderMgr.createOrder(basket);

	        if (!order) {
	            return responseAdaptedToPipelines({
	                error: true,
	                PlaceOrderError: affirmCheck.status
	            }, false);
	        }
	        var handlePaymentsResult = handlePayments(order);

	        if (handlePaymentsResult.error) {
	            return Transaction.wrap(function () {
	                OrderMgr.failOrder(order);
	                return responseAdaptedToPipelines({
	                    error: true,
	                    PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
	                }, false);
	            });

	        } else if (handlePaymentsResult.missingPaymentInfo) {
	            return Transaction.wrap(function () {
	                OrderMgr.failOrder(order);
	                return responseAdaptedToPipelines({
	                    error: true,
	                    PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
	                }, false);
	            });
            }

            var placeOrderStatus = OrderMgr.placeOrder(order);
            if (placeOrderStatus === Status.ERROR) {
                OrderMgr.failOrder(order);
                orderPlacementStatus.error = true;
            } else {
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                order.setExportStatus(Order.EXPORT_STATUS_READY);
                orderPlacementStatus.Order = order;
            }

            if (orderPlacementStatus.error) {
                return responseAdaptedToPipelines({
                    error: true,
                    PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
                }), false;
            }
            postProcess(order);

            // Sending order email
            var Mail = require('dw/net/Mail');
            var Resource = require('dw/web/Resource');
            var Site = require('dw/system/Site');
            var Template = require('dw/util/Template');

            var mail = new Mail();
            mail.addTo(order.getCustomerEmail());
            mail.setSubject(Resource.msg('order.orderconfirmation-email.001', 'order', null));
            mail.setFrom(Site.getCurrent().getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com');

            var HashMap = require('dw/util/HashMap');
            var context = new HashMap();
            var contextData = {
                Order: order,
                CurrentForms: session.forms,
                CurrentHttpParameterMap: request.httpParameterMap,
                CurrentCustomer: customer
            }
            for (var key in contextData) {
                context.put(key, contextData[key])
            }
            var template = new Template('mail/orderconfirmation');
            var content = template.render(context).text;
            mail.setContent(content, 'text/html', 'UTF-8');
            mail.send();
            return responseAdaptedToPipelines(order, true)
        });
    }
    catch (e) {
    	var Logger = require('dw/system/Logger').getLogger('affirm', 'affirm');
        Logger.error("APIException " + e);
        return responseAdaptedToPipelines({}, false)
    }
}

/**
 * Adds Affirm discount coupon
 * @returns {Object} status object
 */
function applyDiscount() {
    var newCouponLi = null;
    var validDiscount = false;
    var discountAmount = 0;
    var affirmDataOrder;
    var basket;
    var triggeredPriceAdjustments;

    if (request.httpMethod == 'OPTIONS') {
        prepareResponse();
        return responseAdaptedToPipelines({}, true);
    } else {
        affirmDataOrder = JSON.parse(request.httpParameterMap.requestBodyAsString).data.order;
        basket = BasketMgr.getCurrentOrNewBasket();

        try {
            Transaction.wrap(function () {
                newCouponLi = basket.createCouponLineItem(affirmDataOrder.discount_code, true);
                validDiscount = newCouponLi.isValid();
            });
        } catch (e) {
            // intentionally left blank
        }

        Transaction.wrap(function () {
            HookMgr.callHook('dw.order.calculate', 'calculate', basket);
        });

        if (validDiscount) {
            if (newCouponLi.priceAdjustments.size() > 0) {
                // Calculate accumulated discounts sum
                triggeredPriceAdjustments = newCouponLi.priceAdjustments.toArray();
                for (var i = 0; i < triggeredPriceAdjustments.length; i++) {
                    // skip shipping promotion calculation, as it's discount applied to price
                    if (triggeredPriceAdjustments[i].promotion.promotionClass !== dw.campaign.Promotion.PROMOTION_CLASS_SHIPPING) {
                        discountAmount +=  triggeredPriceAdjustments[i].getPriceValue();
                    }
                }
                discountAmount *= -100;
            }
        } else {
            discountAmount = 0;
        }

        var affirmShippingOptions = affirm.utils.getShippingOptions();
        var validDiscountCodes = affirm.utils.getValidDiscountsAmount(basket);

        var responseObject =  {
            "discount_data": {
                "most_recent_discount_code": {
                    "discount_amount": discountAmount,
                    "discount_code": affirmDataOrder.discount_code,
                    "valid": validDiscount
                },
                "valid_discount_codes": validDiscountCodes
            },
            "merchant_internal_order_id": basket.UUID,
            "shipping_options": affirmShippingOptions,
            "tax_amount": basket.totalTax.multiply(100).value,
            "total_amount":  basket.totalGrossPrice.multiply(100).value
        };
        prepareResponse();
        return responseAdaptedToPipelines(responseObject, true);
    }
}

/**
 * Redirects to cart in case of cancel
 * @returns {boolean} if flow should be redirected immediately or it's an "OPTIONS" request to test endpoint
 */
function cancel(){
    if (request.httpMethod == 'OPTIONS') {
        prepareResponse();
        return false;
    } else {
        return true
    }
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
exports.Success = success;
exports.Init = init;
exports.Update = updateBasket;
exports.PostProcess = postProcess;
exports.Tracking = addTrackOrderConfirm;
exports.RenderCheckoutNow = renderCheckoutNow;
exports.UpdateShipping = updateShipping;
exports.Confirmation = confirmation;
exports.CreateOrder = createOrder;
exports.ApplyDiscount = applyDiscount;
exports.Cancel = cancel;
