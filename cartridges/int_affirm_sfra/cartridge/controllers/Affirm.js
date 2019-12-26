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
var affirm = require('*/cartridge/scripts/affirm');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderModel = require('*/cartridge/models/order');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Response = require('dw/system/Response');
var ShippingMgr = require('dw/order/ShippingMgr');
var HookMgr = require('dw/system/HookMgr');
var affirmUtils = require('*/cartridge/scripts/utils/affirmUtils');
var checkoutAffirm = require('*/cartridge/scripts/checkout/checkoutAffirm');
var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');

server.post('Update', function (req, res, next) {
    if (!dw.web.CSRFProtection.validateRequest() && !request.httpParameterMap.vcnUpdate.value) {
        res.json({ error: true });
        return next();
    }
    var hookName = 'dw.int_affirm_sfra.payment_instrument.' + affirm.data.VCNPaymentInstrument().toLowerCase();
    var basket = BasketMgr.getCurrentBasket();
    var paymentMethodAffirm = PaymentMgr.getPaymentMethod(AFFIRM_PAYMENT_METHOD);
    res.setContentType('application/json');
    if (HookMgr.hasHook(hookName)) {
        var paymentInstrument = HookMgr.callHook(hookName, 'add', basket);
        if (!paymentInstrument) {
            res.json({ error: true });
            return next();
        }
        Transaction.wrap(function () {
            paymentInstrument.custom.affirmed = true;
        });
    } else {
        res.json({ error: true });
        return next();
    }

    res.json({ error: false });
    return next();
});


server.get('CheckoutObject', function (req, res, next) {
    var basket = BasketMgr.getCurrentBasket();
    if (!basket) {
        res.json();
        return next();
    }	else if (basket.getAllProductLineItems().isEmpty()) {
        res.json();
        return next();
    }
    var affirmTotal = basket.totalGrossPrice.value;
    var vcndata = affirm.basket.getCheckout(basket, 1);
    var enabled = affirm.data.getAffirmVCNStatus() == 'on';
    var affirmselected = true;
    var errormessages = affirm.data.getErrorMessages();

    res.json({
        affirmTotal: affirmTotal,
        vcndata: vcndata,
        enabled: enabled,
        affirmselected: affirmselected,
        errormessages: errormessages
    });
    next();
});

/**
 *
 * Places affirm tracking script to orderconfirmation page
 */
server.get('Tracking', function (req, res, next) {
    var orderId = request.httpParameterMap.orderId ? request.httpParameterMap.orderId.stringValue : false;
    if (orderId) {
        var obj = affirm.order.trackOrderConfirmed(orderId);
        res.setContentType('text/html');
        res.render('order/trackingScript', {
            affirmOnlineAndAnalytics: affirm.data.getAnalyticsStatus(),
            orderInfo: JSON.stringify(obj.orderInfo),
            productInfo: JSON.stringify(obj.productInfo)
        });
    }

    next();
});

/**
 * Renders checkoutnow button linked to Affirm api
 */
server.get('RenderCheckoutNow', function (req, res, next) {
    var productId = request.httpParameterMap.productId.value || false;
    // if express checkout started for specific product ID (e.g. from PDP), existing cart needs to be cleaned up beforehand
    var isCartResetNeeded = productId !== false;
    var currencyCode = session.currency.currencyCode;
    var checkoutItemObject;
    if (affirm.data.getAffirmExpressCheckoutStatus()) {
        checkoutItemObject = affirm.utils.getCheckoutItemsObject(productId, currencyCode);
        res.render('affirm/checkoutNowButton', {
            checkoutItemObject: checkoutItemObject,
            httpProtocol: request.getHttpProtocol(),
            version: 'sfra',
            isCartResetNeeded: isCartResetNeeded,
            paymentLimits: {
                min: affirm.data.getAffirmPaymentMinTotal(),
                max: affirm.data.getAffirmPaymentMaxTotal()
            }
        });
    }
    next();
});

/**
 * Sets response headers
 * @param {httpResponse} res Response object
 */
function setResponseHeaders(res) {
    res.setHttpHeader(Response.ACCESS_CONTROL_ALLOW_ORIGIN, affirm.data.getBaseURL());
    res.setHttpHeader(Response.ACCESS_CONTROL_ALLOW_METHODS, 'POST');
    res.setHttpHeader(Response.ACCESS_CONTROL_ALLOW_CREDENTIALS, 'true');
    res.setHttpHeader(Response.ACCESS_CONTROL_ALLOW_HEADERS, 'content-type');
}

/**
 * Updates current basket shipping data based on Affirm request
 */
server.use('UpdateShipping', function (req, res, next) {
    if (req.httpMethod === 'OPTIONS') {
        setResponseHeaders(res);
        res.json({});
        return next();
    }

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
        affirmUtils.updateShipmentShippingMethod(basket.getDefaultShipment().getID(), selectedShippingMethodId, selectedShippingMethod, applicableShippingMethods);
        HookMgr.callHook('dw.order.calculate', 'calculate', basket);

        var shipment = basket.getShipments().iterator().next();
        var shippingAddress = shipment.createShippingAddress();

        shippingAddress.setFirstName(affirmShippingAddress.firstName);
        shippingAddress.setLastName(affirmShippingAddress.lastName);
        shippingAddress.setAddress1(affirmShippingAddress.address1);
        shippingAddress.setAddress2(affirmShippingAddress.address2 || '');
        shippingAddress.setCity(affirmShippingAddress.city);
        shippingAddress.setPostalCode(affirmShippingAddress.postalCode);
        shippingAddress.setStateCode(affirmShippingAddress.stateCode);
        shippingAddress.setCountryCode(affirmShippingAddress.countryCode);
        shippingAddress.setPhone(affirmShippingAddress.phone);
    });


    var basketTotal = Math.round(basket.totalGrossPrice.value * 100);
    session.privacy.affirmTotal = basket.totalGrossPrice.toFormattedString();
    var tax = Math.round(basket.totalTax.value * 100);

    setResponseHeaders(res);
    res.json({
        tax_amount: tax,
        total_amount: basketTotal,
        merchant_internal_order_id: basket.UUID
    });
    return next();
});

/**
 * Handles successful response from Affirm
 */
server.use('Confirmation', function (req, res, next) {
    var checkoutToken = request.httpParameterMap.checkout_token.stringValue;

    try {
        var basket = BasketMgr.getCurrentOrNewBasket();
        if (affirm.data.getAffirmVCNStatus() != 'on') {
	        var affirmPaymentResult = affirm.utils.setPayment(basket, AFFIRM_PAYMENT_METHOD, true);
	        if (affirmPaymentResult.error) {
	            res.render('/error', {
	                message: Resource.msg('error.confirmation.error', 'confirmation', null)
	            });
	            return next();
	        }
        }
        var affirmCheck = checkoutAffirm.checkCart(basket, checkoutToken, session);
        if (affirmCheck.status.error) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.createOrder(basket);

        if (!order) {
            res.redirect(URLUtils.url('Cart-Show').toString());
            return next();
        }
        var handlePaymentsResult = COHelpers.handlePayments(order, order.getOrderNo());

        if (handlePaymentsResult.error) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', basket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);

        var orderPlacementStatus = COHelpers.placeOrder(order, fraudDetectionStatus);
        if (orderPlacementStatus.error) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        checkoutAffirm.postProcess(order);
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
    } catch (e) {
        var Logger = require('dw/system/Logger').getLogger('affirm', 'affirm');
        Logger.error('APIException ' + e);

        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });
        return next();
    }
});

/**
 * Creates new order based on request from Affirm
 */
server.use('CreateOrder', function (req, res, next) {
    if (req.httpMethod === 'OPTIONS') {
        setResponseHeaders(res);
        res.json({});
        return next();
    }

    var parameterMap = request.httpParameterMap;
    var requestObject = JSON.parse(parameterMap.requestBodyAsString);
    var affirmOrderObj = requestObject.data.order;
    var products = affirmOrderObj.items;
    var nameInArray = affirmOrderObj.shipping.full_name.split(' ');
    var firstName = nameInArray.shift();
    var lastName = nameInArray.join(' ');
    var addressObj = {
        firstName: firstName,
        lastName: lastName,
        address1: affirmOrderObj.shipping.line1,
        address2: affirmOrderObj.shipping.line2 || '',
        countryCode: affirmOrderObj.shipping.country,
        stateCode: affirmOrderObj.shipping.state,
        postalCode: affirmOrderObj.shipping.zipcode,
        city: affirmOrderObj.shipping.city,
        phone: affirmOrderObj.user.phone_number
    };
    var basket = BasketMgr.getCurrentOrNewBasket();
    affirm.utils.setBillingAddress(basket, addressObj, affirmOrderObj.user);
    if (req.querystring.reset_cart === 'true') {
        basket.getAllProductLineItems().toArray().forEach(function (item) {
            basket.removeProductLineItem(item);
        });
        basket.getCouponLineItems().toArray().forEach(function (item) {
            basket.removeCouponLineItem(item);
        });
    
        Transaction.wrap(function () {
            products.forEach(function (prod) {
                var options = prod.options.productOptions || [];
                var childProducts = prod.options.childProducts || [];
                cartHelpers.addProductToCart(basket, prod.sku, prod.qty, childProducts, options);
            });
    
            HookMgr.callHook('dw.order.calculate', 'calculate', basket);
        });
    }

    Transaction.wrap(function () {
        basket.custom.AffirmShippingAddress = JSON.stringify(addressObj);
    });

    var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(basket.getDefaultShipment())
        .getApplicableShippingMethods(addressObj);
    var currentShippingMethod = basket.getDefaultShipment().getShippingMethod() || ShippingMgr.getDefaultShippingMethod();
    var affirmShippingOptions = affirm.utils.getShippingOptions(addressObj);
    // Transaction controls are for fine tuning the performance of the data base interactions when calculating shipping methods

    Transaction.wrap(function () {
        affirmUtils.updateShipmentShippingMethod(
            basket.getDefaultShipment().getID(),
            currentShippingMethod.getID(),
            currentShippingMethod,
            applicableShippingMethods);
        HookMgr.callHook('dw.order.calculate', 'calculate', basket);
    });

    setResponseHeaders(res);

    var basketTotal = Math.round(basket.totalGrossPrice.getDecimalValue() * 100);
    session.privacy.affirmTotal = basket.totalGrossPrice.toFormattedString();	// VCN check
    var tax = Math.round(basket.totalTax.getDecimalValue() * 100);
    var discounts = affirm.basket.collectDiscounts(products, basket);
    res.json({
        shipping_options: affirmShippingOptions,
        merchant_internal_order_id: basket.UUID,
        tax_amount: tax,
        total_amount: basketTotal,
        discount_codes: discounts
    });

    return next();
});

/**
 * Adds Affirm discount coupon
 */
server.use('ApplyDiscount', function (req, res, next) {
    if (req.httpMethod === 'OPTIONS') {
        setResponseHeaders(res);
        res.json({});
        return next();
    }
    var affirmDataOrder = JSON.parse(request.httpParameterMap.requestBodyAsString).data.order;
    var basket = BasketMgr.getCurrentOrNewBasket();

    try {
        Transaction.wrap(function () {
            basket.createCouponLineItem(affirmDataOrder.discount_code, true);
            HookMgr.callHook('dw.order.calculate', 'calculate', basket);
        });
    } catch (e) {
        res.json({
            error: true,
            CouponStatus: e.errorCode });
        return next();
    }
    var affirmShippingOptions = affirm.utils.getShippingOptions();
    var discount = Math.round(basket.couponLineItems[0].priceAdjustments[0].priceValue * -100);

    setResponseHeaders(res);
    res.json({
        discount_data: {
            most_recent_discount_code: {
                discount_amount: discount,
                discount_code: affirmDataOrder.discount_code,
                valid: true
            },
            valid_discount_codes: [
                {
                    discount_amount: discount,
                    discount_code: affirmDataOrder.discount_code,
                    valid: true
                }
            ]
        },
        merchant_internal_order_id: basket.UUID,
        shipping_options: affirmShippingOptions,
        tax_amount: Math.round(basket.totalTax.value * 100),
        total_amount: Math.round(basket.totalGrossPrice.value * 100)
    });
    return next();
});

/**
 * Redirects to cart in case of cancel
 */
server.use('Cancel', function (req, res, next) {
    if (req.httpMethod === 'OPTIONS') {
        setResponseHeaders(res);
        res.json({});
        return next();
    }
    res.redirect(URLUtils.url('Cart-Show').toString());
    return next();
});


module.exports = server.exports();

