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
var currentSite = require('dw/system/Site').getCurrent();
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var Logger = require('dw/system/Logger').getLogger('affirm', 'affirm');

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

        try {
            var OrderMgr = require('dw/order/OrderMgr');
            var order = OrderMgr.createOrder(basket);
        } catch (e) {
            Logger.error('Affirm: Order creation not possible for this basket. Error - {0}', e);
        }

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

        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
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
 * Generates a UUID order_id, writes cart data to AffirmExpressCart Custom Object,
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

    // Build cart data for Custom Object storage
    var cartData = {
        items: affirm.basket.getItems(basket),
        subtotal: affirm.basket.getSubtotal(basket),
        discounts: affirm.basket.getDiscounts(basket),
        currency: basket.getCurrencyCode()
    };

    // Write AffirmExpressCart Custom Object for sessionless lookup in ShippingTotals
    Transaction.wrap(function () {
        var affirmExpressCart = CustomObjectMgr.createCustomObject('AffirmExpressCart', orderId);
        affirmExpressCart.custom.basketUUID = basket.getUUID();
        affirmExpressCart.custom.customerNo = basket.getCustomer() && basket.getCustomer().isRegistered()
            ? basket.getCustomer().getProfile().getCustomerNo()
            : '';
        affirmExpressCart.custom.cartData = JSON.stringify(cartData);
    });

    var checkoutObject = affirm.basket.getExpressCheckout(basket, orderId);

    res.json({
        error: false,
        checkoutObject: checkoutObject
    });
    return next();
});

/**
 * Shipping & Totals HTTP Endpoint for Express Checkout.
 * Called server-to-server by Affirm's backend (no browser session).
 * Validates HMAC, looks up cart via Custom Object, calculates shipping options.
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

    // Look up AffirmExpressCart Custom Object
    var expressCart = CustomObjectMgr.getCustomObject('AffirmExpressCart', orderId);
    if (!expressCart) {
        res.setStatusCode(422);
        res.json({
            errors: [{
                error_code: 'ORDER_NOT_FOUND',
                message: 'Cart session not found or expired.'
            }]
        });
        return next();
    }

    // Validate currency
    if (currency !== 'USD') {
        res.setStatusCode(422);
        res.json({
            errors: [{
                error_code: 'CURRENCY_MISMATCH',
                message: 'Only USD transactions are supported.'
            }]
        });
        return next();
    }

    // Validate address via hook or default validation
    if (HookMgr.hasHook('app.affirm.express.validateAddress')) {
        var cartData = JSON.parse(expressCart.custom.cartData);
        var addressValidation = HookMgr.callHook('app.affirm.express.validateAddress', 'validateAddress', shippingAddress, cartData);
        if (addressValidation && !addressValidation.valid) {
            res.setStatusCode(422);
            res.json({
                errors: [{
                    error_code: addressValidation.error_code || 'INVALID_SHIPPING_ADDRESS',
                    message: addressValidation.message || 'The provided address is not valid.',
                    fields: addressValidation.fields || []
                }]
            });
            return next();
        }
    } else {
        // Default validation: US addresses only
        if (shippingAddress && shippingAddress.country && shippingAddress.country !== 'US') {
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
    }

    // Build SFCC address object for shipping method lookup
    var shippingAddressForLookup = {
        countryCode: shippingAddress.country || 'US',
        stateCode: shippingAddress.state || '',
        postalCode: shippingAddress.zipcode || '',
        city: shippingAddress.city || '',
        address1: shippingAddress.line1 || '',
        address2: shippingAddress.line2 || ''
    };

    // We need a basket to calculate shipping. Look up by basketUUID via the Custom Object.
    // Since this is a sessionless call, we use a temporary basket approach:
    // calculate from the stored cart data + SFCC shipping method lookup.
    var expressCartData = JSON.parse(expressCart.custom.cartData);

    // Build a temporary basket from stored cart data for accurate shipping/tax calculation
    var shippingOptions = [];

    try {
        var tempBasket = BasketMgr.getCurrentOrNewBasket();

        // Populate basket with products from the cart snapshot
        Transaction.wrap(function () {
            var tempShipment = tempBasket.getDefaultShipment();

            // Clear any pre-existing line items
            var existingItems = tempBasket.getAllProductLineItems().iterator();
            while (existingItems.hasNext()) {
                tempBasket.removeProductLineItem(existingItems.next());
            }

            // Recreate product line items from stored cart data
            var items = expressCartData.items || [];
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.sku) {
                    var lineItem = tempBasket.createProductLineItem(item.sku, tempShipment);
                    lineItem.setQuantityValue(item.qty || 1);
                }
            }

            // Set shipping address (needed for applicable-method lookup and tax calc)
            var shippingAddressFromTempBasket = tempShipment.createShippingAddress();
            shippingAddressFromTempBasket.setCountryCode(shippingAddressForLookup.countryCode);
            shippingAddressFromTempBasket.setStateCode(shippingAddressForLookup.stateCode);
            shippingAddressFromTempBasket.setPostalCode(shippingAddressForLookup.postalCode);
            shippingAddressFromTempBasket.setCity(shippingAddressForLookup.city);
            shippingAddressFromTempBasket.setAddress1(shippingAddressForLookup.address1);
            shippingAddressFromTempBasket.setAddress2(shippingAddressForLookup.address2);

            HookMgr.callHook('dw.order.calculate', 'calculate', tempBasket);
        });

        // Get shipping methods applicable to this address
        // Note: Even thoughtempShipment address is set above for basket calculation, method lookup still needs shippingAddressForLookup because getApplicableShippingMethods expects a normal JS object with address fields, not OrderAddress.
        var tempShipment = tempBasket.getDefaultShipment();
        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(tempShipment)
            .getApplicableShippingMethods(shippingAddressForLookup);

        // Cycle each shipping method: set it, recalculate, capture totals, then roll back
        Transaction.begin();

        for (var j = 0; j < applicableShippingMethods.length; j++) {
            var method = applicableShippingMethods[j];

            affirmUtils.updateShipmentShippingMethod(
                tempShipment.getID(), method.getID(), method, applicableShippingMethods
            );
            HookMgr.callHook('dw.order.calculate', 'calculate', tempBasket);

            var shippingAmount = Math.round(tempBasket.getAdjustedShippingTotalPrice().getValue() * 100);
            var taxAmount = Math.round(tempBasket.getTotalTax().getValue() * 100);
            var totalAmount = Math.round(tempBasket.getTotalGrossPrice().getValue() * 100);

            // Allow custom hook to override calculated totals
            if (HookMgr.hasHook('app.affirm.express.calculateTotals')) {
                var totalsResult = HookMgr.callHook(
                    'app.affirm.express.calculateTotals', 'calculateTotals',
                    method, shippingAddress, expressCartData
                );
                if (totalsResult) {
                    shippingAmount = totalsResult.shipping_amount !== undefined ? totalsResult.shipping_amount : shippingAmount;
                    taxAmount = totalsResult.tax_amount !== undefined ? totalsResult.tax_amount : taxAmount;
                    totalAmount = totalsResult.total !== undefined ? totalsResult.total : totalAmount;
                }
            }

            shippingOptions.push({
                shipping_type: method.getID(),
                shipping_label: method.getDisplayName(),
                shipping_amount: shippingAmount,
                tax_amount: taxAmount,
                total: totalAmount
            });
        }

        Transaction.rollback();
    } catch (e) {
        Logger.error('Affirm Express: Error calculating shipping options - {0}', e);
        res.setStatusCode(422);
        res.json({
            errors: [{
                error_code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred. Please try again.'
            }]
        });
        return next();
    }

    // Apply hook filter if available
    if (HookMgr.hasHook('app.affirm.express.filterShippingMethods')) {
        shippingOptions = HookMgr.callHook('app.affirm.express.filterShippingMethods', 'filterShippingMethods', shippingOptions, shippingAddress, expressCartData);
    }

    if (!shippingOptions || shippingOptions.length === 0) {
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
        subtotal: expressCartData.subtotal,
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
        res.redirect(URLUtils.url('Cart-Show').toString());
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

        // Step 4c: Set Affirm payment instrument
        var affirmPaymentResult = affirm.utils.setPayment(basket, AFFIRM_PAYMENT_METHOD, true);
        if (affirmPaymentResult.error) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        // Step 4d: Authorize with Affirm
        var affirmCheck = checkoutAffirm.checkCart(basket, checkoutToken, session);
        if (affirmCheck.status.error) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        // Step 4e: Create order
        var OrderMgr = require('dw/order/OrderMgr');
        var order;
        try {
            order = OrderMgr.createOrder(basket);
        } catch (e) {
            Logger.error('Affirm Express: Order creation failed - {0}', e);
        }

        if (!order) {
            res.redirect(URLUtils.url('Cart-Show').toString());
            return next();
        }

        // Step 4f: Handle payments (calls AFFIRM_PAYMENT Authorize)
        var handlePaymentsResult = COHelpers.handlePayments(order, order.getOrderNo());
        if (handlePaymentsResult.error) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        // Step 4g: Place order
        var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', basket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
        var orderPlacementStatus = COHelpers.placeOrder(order, fraudDetectionStatus);
        if (orderPlacementStatus.error) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        // Step 4h: Post-process (auto-capture if configured)
        checkoutAffirm.postProcess(order);
        COHelpers.sendConfirmationEmail(order, req.locale.id);

        // Clean up AffirmExpressCart Custom Object
        var expressOrderId = checkoutResponse.order_id;
        if (expressOrderId) {
            try {
                var expressCart = CustomObjectMgr.getCustomObject('AffirmExpressCart', expressOrderId);
                if (expressCart) {
                    Transaction.wrap(function () {
                        CustomObjectMgr.remove(expressCart);
                    });
                }
            } catch (cleanupError) {
                Logger.warn('Affirm Express: Failed to clean up AffirmExpressCart - {0}', cleanupError);
            }
        }

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
server.use('ApplyDiscount', function (req, res, next) {4
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

