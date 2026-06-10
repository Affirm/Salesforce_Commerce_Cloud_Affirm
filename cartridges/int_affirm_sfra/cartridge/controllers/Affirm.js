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

        // create the SCAPI basket
        var scapiResponse = scapiBasket.createBasket(
            token,
            basket,
            {
                c_isAffirmExpressCheckout: true
            },
            true);
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

        var checkoutObject = affirm.basket.getExpressCheckout(basket, orderId, {
            scapiBasketId: scapiBasketId,
            scapiShipmentId: scapiShipmentId,
            refreshToken: refreshToken
        });

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

    // Verify HMAC signature
    var hmacResult = affirmUtils.verifyHMAC(request);
    if (!hmacResult.valid) {
        Logger.error('Affirm Express Checkout: HMAC verification failed - {0}', hmacResult.error);
        res.setStatusCode(401);
        res.json({ error: true, message: 'Unauthorized' });
        return next();
    }

    // Parse request body
    var requestBody;
    try {
        requestBody = JSON.parse(request.httpParameterMap.requestBodyAsString);
    } catch (e) {
        res.setStatusCode(400);
        res.json({ error: true, message: 'Invalid JSON' });
        return next();
    }

    var orderId = requestBody.order_id;
    var currency = requestBody.currency;
    var shippingAddress = requestBody.shipping;

    // Validate required fields
    if (!orderId || !shippingAddress) {
        res.setStatusCode(400);
        res.json({ error: true, message: 'Missing order_id or shipping address' });
        return next();
    }

    // Decrypt SCAPI params from encrypted query param
    var encryptedScapi = request.httpParameterMap.scapi.stringValue;
    if (!encryptedScapi) {
        res.setStatusCode(400);
        res.json({ error: true, message: 'Missing SCAPI parameters' });
        return next();
    }

    var scapiParams;
    try {
        scapiParams = affirmUtils.decryptSCAPIParams(encryptedScapi);
    } catch (decryptErr) {
        Logger.error('ShippingTotals: Failed to decrypt SCAPI params - {0}', decryptErr.message);
        res.setStatusCode(400);
        res.json({ error: true, message: 'Invalid SCAPI parameters' });
        return next();
    }
    var scapiBasketId = scapiParams.scapiBasketId;
    var scapiShipmentId = scapiParams.scapiShipmentId;
    var refreshToken = scapiParams.refreshToken;

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

    // Normalize country code: Affirm sends ISO 3166-1 alpha-3 (e.g. "USA"), SCAPI expects alpha-2 (e.g. "US")
    if (shippingAddress && shippingAddress.country && shippingAddress.country.length === 3) {
        var alpha3ToAlpha2 = {
            USA: 'US', CAN: 'CA', MEX: 'MX', GBR: 'GB', AUS: 'AU',
            DEU: 'DE', FRA: 'FR', JPN: 'JP', IND: 'IN', BRA: 'BR',
            CHN: 'CN', KOR: 'KR', ITA: 'IT', ESP: 'ES', NLD: 'NL'
        };
        shippingAddress.country = alpha3ToAlpha2[shippingAddress.country.toUpperCase()] || shippingAddress.country;
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
        order_id: orderId,
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

    /**
     * Normalizes the country code to the ISO 3166-1 alpha-2 format.
     * @param {string} country - The country code to normalize.
     * @returns {string} The normalized country code.
     */
    function normalizeCountryCode(country) {
        if (!country) {
            return "US";
        }

        country = String(country).toUpperCase();

        if (country === "USA" || country === "UNITED STATES") {
            return "US";
        }

        return country;
    }

    /**
     * Gets the shipping and billing name from the checkout response.
     * @param {Object} checkoutResponse - The checkout response.
     * @returns {Object} The shipping and billing name.
     */
    function getAffirmName(checkoutResponse) {
        var shippingName =
            checkoutResponse.shipping && checkoutResponse.shipping.name;
        var billingName =
            checkoutResponse.billing && checkoutResponse.billing.name;

        return {
            first:
                (shippingName && shippingName.first) ||
                (billingName && billingName.first) ||
                "",
            last:
                (shippingName && shippingName.last) ||
                (billingName && billingName.last) ||
                "",
            full:
                (shippingName && shippingName.full) ||
                (billingName && billingName.full) ||
                "",
        };
    }

    try {
        var affirmAPI = require('*/cartridge/scripts/api/affirmAPI');

        // Read checkout from Affirm API to get shipping details
        var checkoutData = affirmAPI.readCheckout(checkoutToken);
        if (!checkoutData || checkoutData.error) {
            Logger.error('Affirm Express: Failed to read checkout - {0}', JSON.stringify(checkoutData));
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        var checkoutResponse = checkoutData.response || checkoutData;
        
        var basket = BasketMgr.getCurrentBasket();

        if (!basket || basket.productLineItems.length === 0) {
            Logger.error('Affirm Express: No active storefront basket found after Affirm return');
            res.redirect(URLUtils.url('Cart-Show').toString());
            return next();
        }

        // Apply shipping address, billing address, shipping method, and email from Affirm data
        Transaction.wrap(function () {
            // Apply shipping address
            var shipment = basket.getDefaultShipment();
            var affirmShipping = checkoutResponse.shipping;
            var affirmBilling = checkoutResponse.billing;

            if (!affirmShipping || !affirmShipping.address) {
                throw new Error('Affirm Express: Shipping address missing from Affirm checkout response');
            }

            var shippingAddress = shipment.shippingAddress || shipment.createShippingAddress();
            var shipAddress = affirmShipping.address;
            var shipName = getAffirmName(checkoutResponse);

            shippingAddress.setFirstName(shipName.first);
            shippingAddress.setLastName(shipName.last);
            shippingAddress.setAddress1(shipAddress.line1 || '');
            shippingAddress.setAddress2(shipAddress.line2 || '');
            shippingAddress.setCity(shipAddress.city || '');
            shippingAddress.setStateCode(shipAddress.state || '');
            shippingAddress.setPostalCode(shipAddress.zipcode || '');
            shippingAddress.setCountryCode(normalizeCountryCode(shipAddress.country));
            shippingAddress.setPhone(
                affirmShipping.phone_number ||
                (affirmBilling && affirmBilling.phone_number) ||
                ''
            );

            // Apply shipping method — shipping_type is in metadata (set during ShippingTotals)
            var shippingType = (checkoutResponse.metadata && checkoutResponse.metadata.shipping_type)
                || (affirmShipping && affirmShipping.shipping_type);

            if (shippingType) {
                var addressObj = {
                    firstName: shippingAddress.firstName,
                    lastName: shippingAddress.lastName,
                    address1: shippingAddress.address1,
                    address2: shippingAddress.address2,
                    city: shippingAddress.city,
                    stateCode: shippingAddress.stateCode,
                    postalCode: shippingAddress.postalCode,
                    countryCode: shippingAddress.countryCode.value,
                    phone: shippingAddress.phone
                };

                var applicableShippingMethods = ShippingMgr
                    .getShipmentShippingModel(shipment)
                    .getApplicableShippingMethods(addressObj);

                affirmUtils.updateShipmentShippingMethod(
                    shipment.getID(),
                    shippingType,
                    null,
                    applicableShippingMethods
                );
            }

            // Apply billing address
            var billingAddress = basket.billingAddress || basket.createBillingAddress();
            var billAddress = (affirmBilling && affirmBilling.address) || shipAddress;
            var billName = (affirmBilling && affirmBilling.name) || shipName;

            billingAddress.setFirstName(billName.first || shipName.first);
            billingAddress.setLastName(billName.last || shipName.last);
            billingAddress.setAddress1(billAddress.line1 || '');
            billingAddress.setAddress2(billAddress.line2 || '');
            billingAddress.setCity(billAddress.city || '');
            billingAddress.setStateCode(billAddress.state || '');
            billingAddress.setPostalCode(billAddress.zipcode || '');
            billingAddress.setCountryCode(normalizeCountryCode(billAddress.country || shipAddress.country));
            billingAddress.setPhone(
                (affirmBilling && affirmBilling.phone_number) ||
                affirmShipping.phone_number ||
                ''
            );

            var email =
                checkoutResponse.email ||
                (affirmBilling && affirmBilling.email) ||
                (affirmShipping && affirmShipping.email) ||
                '';

            if (email) {
                basket.setCustomerEmail(email);
            }

        });

        // Set Affirm payment instrument (mirrors CheckoutServices SubmitPayment L247-255)
        var affirmPaymentResult = affirm.utils.setPayment(basket, 'Affirm', true);
        if (affirmPaymentResult.error) {
            Logger.error('Affirm Express: Failed to set payment instrument');
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        // Recalculate totals after payment instrument change (mirrors SubmitPayment L282-289)
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(basket);
        });

        var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(basket);
        if (calculatedPaymentTransaction.error) {
            Logger.error('Affirm Express: Failed to calculate payment transaction');
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        // Affirm authorize, create order, payments, place, email
        var finalizeResult = affirmOrderFinalize.finalizeAffirmOrder({
            basket: basket,
            checkoutToken: checkoutToken,
            session: session,
            localeId: req.locale.id,
            skipSetPayment: true,
            orderCreateFailLogContext: 'Affirm Express'
        });

        if (!finalizeResult.ok) {
            Logger.error('Affirm Express: finalizeAffirmOrder failed - mode={0}', finalizeResult.mode);
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

        if (typeof COHelpers.setCustomer === 'function') {
            COHelpers.setCustomer(order, req.currentCustomer.raw);
        }

        // TODO: What is the correct way to redirect to the order confirmation page?
        // res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
        res.render('checkout/confirmation/orderConfirmForm', {
            orderID: order.orderNo,
            orderToken: order.orderToken,
            returningCustomer: true
        });

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

    res.redirect(URLUtils.url('Cart-Show').toString());
    return next();
});


module.exports = server.exports();

