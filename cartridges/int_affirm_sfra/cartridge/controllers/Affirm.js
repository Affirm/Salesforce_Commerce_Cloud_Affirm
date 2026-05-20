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
var UUIDUtils = require('dw/util/UUIDUtils');
var Logger = require('dw/system/Logger').getLogger('affirm', 'affirm');
var slasAuth = require('*/cartridge/scripts/scapi/slasAuth');
var scapiBasket = require('*/cartridge/scripts/scapi/scapiBasket');
var affirmTracker = require('*/cartridge/scripts/utils/affirmTracker');

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
    if (!affirm.data.getExpressCheckoutEnabled()) {
        res.setStatusCode(404);
        res.json({ error: true, message: 'Express Checkout is not enabled' });
        return next();
    }

    if (affirm.data.getAffirmVCNStatus() == 'on') {
        res.setStatusCode(400);
        res.json({ error: true, message: 'Express Checkout is not supported in VCN mode' });
        return next();
    }

    var basket = BasketMgr.getCurrentOrNewBasket();
    var pid = req.querystring.pid;
    var quantity = req.querystring.quantity ? parseInt(req.querystring.quantity, 10) : 1;

    // PDP flow: add product to basket before proceeding
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

    var orderId = UUIDUtils.createUUID();

    try {
        // Create SCAPI basket for sessionless shipping calculation
        var slasTokenResp = slasAuth.getGuestToken();
        var token = slasTokenResp.access_token;
        var refreshToken = slasTokenResp.refresh_token;

        var plis = basket.getAllProductLineItems().iterator();
        var scapiItems = [];
        while (plis.hasNext()) {
            var pli = plis.next();
            // SCAPI rejects master product IDs — resolve to variant
            var product = pli.getProduct();
            var pid = pli.getProductID();
            if (product && product.isMaster()) {
                var defaultVariant = product.getVariationModel().getDefaultVariant();
                if (defaultVariant) {
                    pid = defaultVariant.getID();
                }
            } else if (product && product.isVariant()) {
                pid = product.getID();
            }
            scapiItems.push({
                productId: pid,
                quantity: pli.getQuantityValue()
            });
        }

        var scapiResponse = scapiBasket.createBasketWithItems(token, scapiItems);
        var scapiBasketId = scapiResponse.basketId || scapiResponse.basket_id;
        var scapiShipmentId = scapiResponse.shipments[0].shipmentId || scapiResponse.shipments[0].shipment_id;

        // Apply coupons from storefront basket
        var couponLineItems = basket.getCouponLineItems().iterator();
        while (couponLineItems.hasNext()) {
            var couponLI = couponLineItems.next();
            try {
                scapiBasket.applyCoupon(token, scapiBasketId, couponLI.getCouponCode());
            } catch (couponErr) {
                Logger.warn('Failed to apply coupon {0} to SCAPI basket: {1}', couponLI.getCouponCode(), couponErr.message);
            }
        }

        // Store SCAPI basket info in session for Cancel/Confirmation cleanup
        session.privacy.scapiBasketId = scapiBasketId;
        session.privacy.scapiShipmentId = scapiShipmentId;
        session.privacy.slasToken = token;

        // Encode SCAPI IDs + refresh token into order_id
        // Refresh token is ~44 chars, so total order_id is ~101 chars (under 128 limit)
        // Format: {orderId}:{scapiBasketId}:{scapiShipmentId}:{refreshToken}
        var compoundOrderId = orderId + ':' + scapiBasketId + ':' + scapiShipmentId + ':' + refreshToken;

        var checkoutObject = affirm.basket.getExpressCheckout(basket, compoundOrderId);

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
 * Shipping & Totals HTTP Endpoint for Express Checkout.
 * Called server-to-server by Affirm's backend (no browser session).
 * Validates HMAC, looks up cart via Custom Object, calculates shipping options
 * using SCAPI dual-basket approach (sessionless).
 */
server.post('ShippingTotals', function (req, res, next) {
    res.setContentType('application/json');

    if (!affirm.data.getExpressCheckoutEnabled()) {
        res.setStatusCode(404);
        res.json({ error: true });
        return next();
    }

    // TODO: Re-enable HMAC verification after testing
    // Verify HMAC signature
    // var hmacResult = affirmUtils.verifyHMAC(request);
    // if (!hmacResult.valid) {
    //     Logger.error('Affirm Express Checkout: HMAC verification failed - {0}', hmacResult.error);
    //     res.setStatusCode(401);
    //     res.json({ error: true, message: 'Unauthorized' });
    //     return next();
    // }

    // Parse request body
    var requestBody;
    try {
        requestBody = JSON.parse(request.httpParameterMap.requestBodyAsString);
    } catch (e) {
        res.setStatusCode(400);
        res.json({ error: true, message: 'Invalid JSON' });
        return next();
    }

    var compoundOrderId = requestBody.order_id;
    var currency = requestBody.currency;
    var shippingAddress = requestBody.shipping;

    // Validate required fields
    if (!compoundOrderId || !shippingAddress) {
        res.setStatusCode(400);
        res.json({ error: true, message: 'Missing order_id or shipping address' });
        return next();
    }

    // Parse compound order_id: {uuid}:{scapiBasketId}:{scapiShipmentId}:{refreshToken}
    // Refresh token may contain hyphens but not colons, so split is safe
    var orderIdParts = compoundOrderId.split(':');
    if (orderIdParts.length < 4) {
        res.setStatusCode(400);
        res.json({ error: true, message: 'Invalid order_id format' });
        return next();
    }
    var orderId = orderIdParts[0];
    var scapiBasketId = orderIdParts[1];
    var scapiShipmentId = orderIdParts[2];
    var refreshToken = orderIdParts[3];

    Logger.debug('ShippingTotals: orderId={0}, scapiBasketId={1}, scapiShipmentId={2}', orderId, scapiBasketId, scapiShipmentId);

    // Validate currency
    if (currency && currency !== 'USD') {
        affirmTracker.trackErrorWithoutStack('express_shipping_totals', 'Currency mismatch: ' + currency, affirmTracker.INTERNAL_SERVER_ERROR);
        res.setStatusCode(422);
        res.json({
            errors: [{
                error_code: 'CURRENCY_MISMATCH',
                message: 'Only USD transactions are supported.'
            }]
        });
        return next();
    }

    // Normalize country code: Affirm sends "USA" (ISO 3166-1 alpha-3), SCAPI expects "US" (alpha-2)
    if (shippingAddress && shippingAddress.country === 'USA') {
        shippingAddress.country = 'US';
    }

    // Default validation: US addresses only
    if (shippingAddress && shippingAddress.country && shippingAddress.country !== 'US') {
        affirmTracker.trackErrorWithoutStack('express_shipping_totals', 'Unsupported shipping zone: ' + shippingAddress.country, affirmTracker.INTERNAL_SERVER_ERROR);
        res.setStatusCode(422);
        res.json({
            errors: [{
                error_code: 'UNSUPPORTED_SHIPPING_ZONE',
                message: 'Only US shipping addresses are supported.',
                fields: ['shipping_address.country']
            }]
        });
        return next();
    }

    // Use SCAPI dual-basket approach: set shipping address on the SCAPI basket
    // The modifyPUTResponse hook calculates all shipping method totals in one call
    var shippingOptions = [];
    var subtotal = 0;

    try {
        // Exchange refresh token for a new access token (same guest identity that created the basket)
        var refreshedToken = slasAuth.refreshAccessToken(refreshToken);
        var token = refreshedToken.access_token;
        Logger.debug('ShippingTotals: refreshed SLAS token');

        // Map Affirm address format to SCAPI format (handle nulls from Affirm)
        var scapiAddress = {
            firstName: shippingAddress.first_name || shippingAddress.name && shippingAddress.name.first || '',
            lastName: shippingAddress.last_name || shippingAddress.name && shippingAddress.name.last || '',
            address1: shippingAddress.line1 || '',
            address2: shippingAddress.line2 || '',
            city: shippingAddress.city || '',
            stateCode: shippingAddress.state || '',
            postalCode: shippingAddress.zipcode || '',
            countryCode: shippingAddress.country || 'US',
            phone: shippingAddress.phone_number || ''
        };

        Logger.debug('ShippingTotals: calling setShippingAddress basketId={0} shipmentId={1}', scapiBasketId, scapiShipmentId);

        // Set shipping address on SCAPI basket — hook enriches response
        var scapiResponse = scapiBasket.setShippingAddress(token, scapiBasketId, scapiShipmentId, scapiAddress);

        shippingOptions = scapiResponse.c_shippingOptions || [];
        subtotal = scapiResponse.c_subtotalCents || 0;

        // Apply hook filter if available
        if (HookMgr.hasHook('app.affirm.express.filterShippingMethods')) {
            shippingOptions = HookMgr.callHook('app.affirm.express.filterShippingMethods', 'filterShippingMethods', shippingOptions, shippingAddress);
        }
    } catch (scapiErr) {
        Logger.error('Affirm Express: SCAPI shipping calculation failed - {0}', scapiErr.message);
        affirmTracker.trackErrorWithStack('express_shipping_totals', scapiErr);
        res.setStatusCode(422);
        res.json({
            errors: [{
                error_code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }]
        });
        return next();
    }

    if (!shippingOptions || shippingOptions.length === 0) {
        affirmTracker.trackErrorWithoutStack('express_shipping_totals', 'No shipping options available for address', affirmTracker.INTERNAL_SERVER_ERROR);
        res.setStatusCode(422);
        res.json({
            errors: [{
                error_code: 'SHIPPING_METHOD_UNAVAILABLE',
                message: 'No shipping options are available for this address.'
            }]
        });
        return next();
    }

    res.json({
        order_id: compoundOrderId,
        currency: 'USD',
        subtotal: subtotal,
        shipping_options: shippingOptions
    });
    return next();
});

/**
 * Handles Express Checkout confirmation.
 * Reads checkout from Affirm API, applies shipping/billing to basket,
 * creates order, authorizes, validates amounts, and places order.
 */
server.use('ExpressConfirmation', function (req, res, next) {
    var checkoutToken = request.httpParameterMap.checkout_token.stringValue;

    if (!checkoutToken) {
        Logger.error('Affirm Express: Missing checkout_token on ExpressConfirmation');
        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });
        return next();
    }

    try {
        var affirmAPI = require('*/cartridge/scripts/api/affirmAPI');

        // Step 4a: Read checkout from Affirm API to get shipping details
        var checkoutData = affirmAPI.readCheckout(checkoutToken);
        if (!checkoutData || checkoutData.error) {
            Logger.error('Affirm Express: Failed to read checkout - {0}', JSON.stringify(checkoutData));
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        var checkoutResponse = checkoutData.response || checkoutData;

        var basket = BasketMgr.getCurrentOrNewBasket();

        // Step 4b: Apply shipping address, billing address, shipping method, and email from Affirm data
        Transaction.wrap(function () {
            // Apply shipping address
            var shipment = basket.getDefaultShipment();
            var shippingAddr = shipment.createShippingAddress();
            var affirmShipping = checkoutResponse.shipping;

            if (affirmShipping) {
                shippingAddr.setFirstName(affirmShipping.name ? affirmShipping.name.first || '' : '');
                shippingAddr.setLastName(affirmShipping.name ? affirmShipping.name.last || '' : '');
                shippingAddr.setAddress1(affirmShipping.address ? affirmShipping.address.line1 || '' : '');
                shippingAddr.setAddress2(affirmShipping.address ? affirmShipping.address.line2 || '' : '');
                shippingAddr.setCity(affirmShipping.address ? affirmShipping.address.city || '' : '');
                shippingAddr.setStateCode(affirmShipping.address ? affirmShipping.address.state || '' : '');
                shippingAddr.setPostalCode(affirmShipping.address ? affirmShipping.address.zipcode || '' : '');
                shippingAddr.setCountryCode(affirmShipping.address ? affirmShipping.address.country || 'US' : 'US');
                shippingAddr.setPhone(affirmShipping.phone_number || '');
            }

            // Apply shipping method
            if (affirmShipping && affirmShipping.shipping_type) {
                var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(shipment)
                    .getApplicableShippingMethods(shippingAddr);
                affirmUtils.updateShipmentShippingMethod(
                    shipment.getID(),
                    affirmShipping.shipping_type,
                    null,
                    applicableShippingMethods
                );
            }

            // Apply billing address
            var billingAddr = basket.createBillingAddress();
            var affirmBilling = checkoutResponse.billing || affirmShipping;

            if (affirmBilling) {
                var billingName = affirmBilling.name || (affirmShipping ? affirmShipping.name : null);
                var billingAddress = affirmBilling.address || (affirmShipping ? affirmShipping.address : null);

                billingAddr.setFirstName(billingName ? billingName.first || '' : '');
                billingAddr.setLastName(billingName ? billingName.last || '' : '');
                billingAddr.setAddress1(billingAddress ? billingAddress.line1 || '' : '');
                billingAddr.setAddress2(billingAddress ? billingAddress.line2 || '' : '');
                billingAddr.setCity(billingAddress ? billingAddress.city || '' : '');
                billingAddr.setStateCode(billingAddress ? billingAddress.state || '' : '');
                billingAddr.setPostalCode(billingAddress ? billingAddress.zipcode || '' : '');
                billingAddr.setCountryCode(billingAddress ? billingAddress.country || 'US' : 'US');
                billingAddr.setPhone(affirmBilling.phone_number || (affirmShipping ? affirmShipping.phone_number || '' : ''));
            }

            // Set customer email
            var email = (affirmShipping && affirmShipping.email) || (affirmBilling && affirmBilling.email) || '';
            if (email) {
                basket.setCustomerEmail(email);
            }

            // Recalculate basket with final shipping method + address
            HookMgr.callHook('dw.order.calculate', 'calculate', basket);
        });

        // Step 4c–4h: Affirm PI, authorize, create order, payments, place, email
        var finalizeResult = affirmOrderFinalize.finalizeAffirmOrder({
            basket: basket,
            checkoutToken: checkoutToken,
            session: session,
            localeId: req.locale.id,
            orderCreateFailLogContext: 'Affirm Express'
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

        var order = finalizeResult.order;

        // Clean up SCAPI basket (best-effort)
        try {
            if (session.privacy.slasToken && session.privacy.scapiBasketId) {
                scapiBasket.deleteBasket(session.privacy.slasToken, session.privacy.scapiBasketId);
            }
        } catch (scapiCleanupErr) {
            Logger.warn('Affirm Express: Failed to clean up SCAPI basket - {0}', scapiCleanupErr.message);
        }
        session.privacy.slasToken = null;
        session.privacy.scapiBasketId = null;
        session.privacy.scapiShipmentId = null;

        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
        return next();
    } catch (e) {
        Logger.error('Affirm Express Confirmation error: {0}', e);
        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });
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

    // Cleanup SCAPI basket if active
    try {
        if (session.privacy.slasToken && session.privacy.scapiBasketId) {
            scapiBasket.deleteBasket(session.privacy.slasToken, session.privacy.scapiBasketId);
        }
    } catch (e) {
        // best-effort cleanup
    }
    session.privacy.slasToken = null;
    session.privacy.scapiBasketId = null;
    session.privacy.scapiShipmentId = null;

    res.redirect(URLUtils.url('Cart-Show').toString());
    return next();
});


module.exports = server.exports();

