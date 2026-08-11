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
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderModel = require('*/cartridge/models/order');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Response = require('dw/system/Response');
var ShippingMgr = require('dw/order/ShippingMgr');
var HookMgr = require('dw/system/HookMgr');
var affirmUtils = require('*/cartridge/scripts/utils/affirmUtils');
var affirmOrderFinalize = require('*/cartridge/scripts/checkout/affirmOrderFinalize');
var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');
var currentSite = require('dw/system/Site').getCurrent();
var Logger = require('dw/system/Logger').getLogger('Affirm', 'affirmController');
var slasAuth = require('*/cartridge/scripts/scapi/slasAuth');
var scapiBasket = require('*/cartridge/scripts/scapi/scapiBasket');
var affirmTracker = require('*/cartridge/scripts/utils/affirmTracker');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var ProductMgr = require('dw/catalog/ProductMgr');
var affirmAPI = require('*/cartridge/scripts/api/affirmAPI');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

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
            validated: JSON.stringify(obj.validated)
        });
    }

    next();
});

/**
 * Sets response headers
 * @param {httpResponse} res Response object
 */
function setResponseHeaders(res) {
    res.setHttpHeader(Response.ACCESS_CONTROL_ALLOW_ORIGIN, 'http://' + currentSite.getHttpsHostName());
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
        var finalizeResult = affirmOrderFinalize.finalizeAffirmOrder({
            basket: basket,
            checkoutToken: checkoutToken,
            session: session,
            localeId: req.locale.id,
            skipSetPayment: affirm.data.getAffirmVCNStatus() == 'on',
            orderCreateFailLogContext: 'Affirm'
        });

        if (!finalizeResult.ok) {
            if (finalizeResult.mode === 'cart') {
                res.redirect(URLUtils.url('Cart-Show').toString());
            } else {
                res.render('/error', {
                    message: Resource.msg('error.confirmation.error', 'confirmation', null)
                });
            }
            return next();
        }

        res.redirect(URLUtils.url('Order-Confirm', 'ID', finalizeResult.order.orderNo, 'token', finalizeResult.order.orderToken).toString());
        return next();
    } catch (e) {
        Logger.error('APIException ' + e);

        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });
        return next();
    }
});

/**
 * Initiates Affirm Express Checkout.
 * Generates a UUID order_id, creates a SCAPI basket for sessionless shipping calculation,
 * and returns the Express Checkout object for affirm.checkout().
 *
 * Accepts optional query params for PDP context: pid, quantity, options
 */
server.get('ExpressCheckout', function (req, res, next) {
    // check if express checkout is enabled
    if (!affirm.data.getExpressCheckoutEnabled()) {
        res.setStatusCode(404);
        res.json({ error: true, message: 'Express Checkout is not enabled' });
        return next();
    }

    // express checkout is currently not supported in VCN mode
    if (affirm.data.getAffirmVCNStatus() == 'on') {
        res.setStatusCode(400);
        res.json({ error: true, message: 'Express Checkout is not supported in VCN mode' });
        return next();
    }

    // get the basket
    var basket = BasketMgr.getCurrentOrNewBasket();
    var pid = req.querystring.pid;
    var quantity = req.querystring.quantity ? parseInt(req.querystring.quantity, 10) : 1;

    // Determine the cancel URL — validate same-origin to prevent open redirect
    var cancelUrl = URLUtils.https('Cart-Show').toString();
    var rawCancelUrl = req.querystring.cancelUrl;
    if (rawCancelUrl) {
        var siteOrigin = URLUtils.https('Home-Show').toString().split('/').slice(0, 3).join('/');
        if (rawCancelUrl.indexOf(siteOrigin) === 0) {
            cancelUrl = rawCancelUrl;
        }
    }

    // PDP flow: add product (product ID) to basket before proceeding
    if (pid) {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var product = ProductMgr.getProduct(pid);
        if (!product || !product.isOnline()) {
            res.json({ error: true, message: 'Product not found or unavailable' });
            return next();
        }

        Transaction.wrap(function () {
            var shipment = basket.getDefaultShipment();
            var productLineItems = basket.getProductLineItems(pid);
            var existingLineItem = null;

            // Check if product already exists in basket
            var iter = productLineItems.iterator();
            while (iter.hasNext()) {
                var pli = iter.next();
                if (pli.productID === pid) {
                    existingLineItem = pli;
                    break;
                }
            }

            if (existingLineItem) {
                existingLineItem.setQuantityValue(existingLineItem.getQuantityValue() + quantity);
            } else {
                var lineItem = basket.createProductLineItem(pid, shipment);
                lineItem.setQuantityValue(quantity);
            }

            HookMgr.callHook('dw.order.calculate', 'calculate', basket);
        });
    }

    if (basket.getAllProductLineItems().isEmpty()) {
        res.json({ error: true, message: 'Basket is empty' });
        return next();
    }

    var orderId = basket.UUID;

    // create a SCAPI basket for sessionless shipping and totals calculation
    try {
        // get the SLAS token for SCAPI basket creation
        var slasTokenResp = slasAuth.getGuestToken();
        var token = slasTokenResp.access_token;
        var refreshToken = slasTokenResp.refresh_token;

        // Create the temporary SCAPI basket that mirrors the storefront basket.
        var scapiResponse = scapiBasket.createExpressBasket(
            token,
            slasTokenResp.usid,
            basket,
            {
                c_isAffirmExpressCheckout: true
            },
            true);
        var scapiBasketId = scapiResponse.basketId || scapiResponse.basket_id;
        var scapiShipmentId = scapiResponse.shipments[0].shipmentId || scapiResponse.shipments[0].shipment_id;

        var checkoutObject = affirm.basket.getExpressCheckout(basket, orderId, {
            scapiBasketId: scapiBasketId,
            scapiShipmentId: scapiShipmentId,
            refreshToken: refreshToken
        }, cancelUrl);

        res.json({
            error: false,
            checkoutObject: checkoutObject
        });
        return next();
    } catch (e) {
        Logger.error('Affirm Express Checkout error: {0}', e);
        affirmTracker.trackErrorWithStack('express_checkout', e);
        res.json({ error: true, message: 'Failed to initialize Express Checkout' });
        return next();
    }
});

/**
 * Adds Affirm discount coupon
 */
server.use('ApplyDiscount', function (req, res, next) {
    var newCouponLi = null;
    var validDiscount = false;
    var discountAmount = 0;
    var affirmDataOrder;
    var basket;
    var triggeredPriceAdjustments;

    if (req.httpMethod === 'OPTIONS') {
        setResponseHeaders(res);
        res.json({});
        return next();
    }
    var affirmDataOrder = JSON.parse(request.httpParameterMap.requestBodyAsString).data.order;
    var basket = BasketMgr.getCurrentOrNewBasket();

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

    setResponseHeaders(res);
    res.json({
        discount_data: {
            most_recent_discount_code: {
                discount_amount: discountAmount,
                discount_code: affirmDataOrder.discount_code,
                valid: validDiscount
            },
            valid_discount_codes: validDiscountCodes
        },
        merchant_internal_order_id: basket.UUID,
        shipping_options: affirmShippingOptions,
        tax_amount: basket.totalTax.multiply(100).value,
        total_amount: basket.totalGrossPrice.multiply(100).value
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

