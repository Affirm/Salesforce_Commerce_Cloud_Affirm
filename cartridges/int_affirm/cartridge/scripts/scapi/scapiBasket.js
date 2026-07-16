"use strict";

var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry");
var Logger = require("dw/system/Logger").getLogger("Affirm", "scapiBasket");
var affirmData = require("*/cartridge/scripts/data/affirmData");

/**
 * Returns the SCAPI baskets base URL.
 * @returns {string} base URL
 */
function getBaseUrl() {
    var shortCode = affirmData.getSCAPIShortCode();
    var orgId = affirmData.getSCAPIOrgId();
    return (
        "https://" +
        shortCode +
        ".api.commercecloud.salesforce.com" +
        "/checkout/shopper-baskets/v2/organizations/" +
        orgId +
        "/baskets"
    );
}

/**
 * Returns the SCAPI site ID query param.
 * @returns {string} query string like "?siteId=SiteGenesis"
 */
function siteParam() {
    return "?siteId=" + encodeURIComponent(affirmData.getSCAPISiteId());
}

/**
 * Executes a SCAPI basket service call.
 *
 * @param {string} token - Bearer access token
 * @param {string} method - HTTP method
 * @param {string} url - Full URL
 * @param {Object|null} body - Request body (null for DELETE/GET)
 * @returns {Object} parsed response
 */
function callService(token, method, url, body) {
    var service = LocalServiceRegistry.createService("affirm.scapi.basket", {
        createRequest: function (svc) {
            svc.setURL(url);
            svc.setRequestMethod(method);
            svc.addHeader("Content-Type", "application/json");
            svc.addHeader("Authorization", "Bearer " + token);
            if (body) {
                return JSON.stringify(body);
            }
            return null;
        },
        parseResponse: function (svc, resp) {
            if (resp.text) {
                return JSON.parse(resp.text);
            }
            return null;
        },
        filterLogMessage: function (msg) {
            return msg;
        },
    });

    var result = service.call();
    if (!result.ok) {
        Logger.error(
            "SCAPI basket call failed [{0} {1}]: {2}",
            method,
            url,
            result.errorMessage
        );
        throw new Error("SCAPI basket call failed: " + result.errorMessage);
    }

    return result.object;
}

/**
 * Sets SCAPI Shopper Context for the given SLAS guest identity (USID).
 *
 * Shopper Context is keyed by USID, not by access token, so any basket created
 * or recalculated under the same identity — including after the refresh-token
 * exchange on the sessionless Shipping & Totals callback — is priced with the
 * context set here. This is how storefront promotions that qualify by customer
 * group / source code / geo re-fire on the headless SCAPI basket.
 *
 * Requires the SLAS private client to have the `sfcc.shopper-context.rw` scope.
 * Guest context TTL is 1 day (fixed by the platform); a fresh USID is minted per
 * Express Checkout initiation, so contexts are effectively single-use.
 *
 * @param {string} token - Bearer access token (same identity as usid)
 * @param {string} usid - SLAS unique shopper ID the context is bound to
 * @param {dw.order.Basket} basket - storefront basket to read context from
 * @returns {Object} the created shopper context
 */
exports.setShopperContext = function (token, usid, basket) {
    var shortCode = affirmData.getSCAPIShortCode();
    var orgId = affirmData.getSCAPIOrgId();
    var url =
        "https://" +
        shortCode +
        ".api.commercecloud.salesforce.com" +
        "/shopper/shopper-context/v1/organizations/" +
        orgId +
        "/shopper-context/" +
        usid +
        siteParam();

    // Customer groups — copied so SCAPI force-assigns the guest identity into the
    // same groups the storefront customer is in, re-firing group/segment/loyalty
    // qualified promotions on the mirrored basket.
    var customerGroupIds = [];
    var customer = basket.getCustomer();
    if (customer) {
        var groups = customer.getCustomerGroups().iterator();
        while (groups.hasNext()) {
            customerGroupIds.push(groups.next().getID());
        }
    }

    // Source code — copied so source-code-qualified promotions and price books
    // apply. SFCC keeps the active source code on the shopper session.
    // NOTE: verify the exact accessor for your SFCC version; wrapped defensively.
    var sourceCode = null;
    try {
        if (session && session.sourceCodeInfo) {
            sourceCode = session.sourceCodeInfo.code;
        }
    } catch (e) {
        sourceCode = null;
    }

    var body = {
        customerGroupIds: customerGroupIds,
        // IP / geo qualifiers — let location-qualified promotions fire.
        clientIp: request.httpRemoteAddress || "",
        customQualifiers: {
            ipAddress: request.httpRemoteAddress || "",
            operatingSystem: request.httpUserAgent || "",
        },
    };

    if (sourceCode) {
        body.sourceCode = sourceCode;
    }

    return callService(token, "PUT", url, body);
};

/**
 * Creates a temporary SCAPI basket that mirrors the storefront basket for
 * sessionless Express Checkout, reproducing as much of the storefront's
 * pricing/discount context as SCAPI supports.
 *
 * This is the SINGLE place where storefront -> SCAPI copying happens. Ordering
 * matters: shopper context must be set BEFORE the basket is created so the
 * promotion engine prices the new basket with the shopper's context; coupons
 * need the basket ID, so they are applied after creation.
 *
 * ── WHAT IS COPIED OVER ─────────────────────────────────────────────────────
 *   1. Shopper context   — customer groups, source code, IP/geo qualifiers
 *                          (setShopperContext). Re-fires group / source-code /
 *                          geo qualified promotions on the headless basket.
 *   2. Product line items — product id, quantity, option items. SCAPI re-prices
 *                          each item from the catalog at list price; discounts
 *                          come from context (step 1) + coupons (step 3).
 *   3. Coupon codes      — every shopper-entered coupon on the storefront basket
 *                          is re-submitted so SCAPI re-derives the discount.
 *
 * ── WHAT IS NOT COPIED (known gaps; modal totals may diverge) ────────────────
 *   - Manual / programmatic price adjustments applied in storefront controller
 *     code — no coupon or rule to replay, so SCAPI cannot reproduce them.
 *   - Product-level price overrides set directly on storefront line items.
 *   - Device-type-qualified promotions — we don't replicate SFCC's device
 *     detection, so a device-qualified promo may not fire identically.
 *   - Bonus / gift-with-purchase line items — intentionally skipped below
 *     (SCAPI would otherwise price them at full price).
 *   Because the real order is finalized from the STOREFRONT basket, these gaps
 *   affect only the totals shown in the Affirm modal, not the charged amount.
 *
 * Shopper-context and coupon steps are best-effort: a failure logs a warning and
 * degrades the displayed totals rather than blocking checkout. Basket creation
 * failure is fatal (there is nothing to price) and propagates to the caller.
 *
 * @param {string} token - Bearer access token
 * @param {string} usid - SLAS unique shopper ID (for shopper context)
 * @param {dw.order.Basket} basket - storefront basket to mirror
 * @param {Object} customAttributes - SCAPI basket custom attributes to set on creation
 * @param {boolean} temporary - create the SCAPI basket as temporary (auto-expiring)
 * @returns {Object} the created SCAPI basket (includes basket_id and shipments)
 */
exports.createExpressBasket = function (token, usid, basket, customAttributes, temporary) {
    // ── 1. Shopper context ──────────────────────────────────────────────────
    // MUST run before the basket is created so the promotion engine prices the
    // new basket with the shopper's customer groups / source code / geo context.
    try {
        exports.setShopperContext(token, usid, basket);
    } catch (e) {
        Logger.warn(
            "Failed to set shopper context (group/source/geo promotions may not apply): {0}",
            e.message
        );
    }

    // ── 2. Product line items ───────────────────────────────────────────────
    // Copy products, quantities, and option items from the storefront basket.
    var url = getBaseUrl() + siteParam() + (temporary ? "&temporary=true" : "");
    var productItems = [];

    if (basket && basket.productLineItems) {
        // productLineItems is a flat list — includes parent, child, option, bonus, and bundled PLIs
        basket.productLineItems.toArray().forEach(function (productLineItem) {
            // Skip child/non-standard PLIs:
            // - option: already included as option_items on the parent PLI
            // - bonus: free promotional products that SCAPI would price at full price
            // - bundled: children of a product bundle; the parent bundle PLI carries the price
            if (
                productLineItem.optionProductLineItem ||
                productLineItem.bonusProductLineItem ||
                productLineItem.bundledProductLineItem
            ) {
                return;
            }

            var productId = productLineItem.productID;
            var quantity = productLineItem.quantityValue || 1;

            if (!productId) {
                return;
            }

            var scapiProductItem = {
                product_id: productId,
                quantity: quantity,
            };

            if (
                productLineItem.optionProductLineItems &&
                productLineItem.optionProductLineItems.length > 0
            ) {
                var optionItems = [];

                productLineItem.optionProductLineItems
                    .toArray()
                    .forEach(function (optionLineItem) {
                        var optionValueId = optionLineItem.productID;

                        if (!optionValueId || optionValueId === "none") {
                            return;
                        }

                        optionItems.push({
                            option_id: optionLineItem.optionID,
                            option_value_id: optionValueId,
                        });
                    });

                if (optionItems.length > 0) {
                    scapiProductItem.option_items = optionItems;
                }
            }

            productItems.push(scapiProductItem);
        });
    }

    var body = {
        product_items: productItems,
    };

    if (customAttributes) {
        Object.keys(customAttributes).forEach(function (key) {
            body[key] = customAttributes[key];
        });
    }

    var scapiResponse = callService(token, "POST", url, body);
    var scapiBasketId = scapiResponse.basketId || scapiResponse.basket_id;

    // ── 3. Coupon codes ─────────────────────────────────────────────────────
    // Re-submit each shopper-entered coupon so SCAPI re-evaluates and re-derives
    // the discount on the mirrored basket.
    if (scapiBasketId && basket.getCouponLineItems) {
        var couponLineItems = basket.getCouponLineItems().iterator();
        while (couponLineItems.hasNext()) {
            var couponLI = couponLineItems.next();
            try {
                exports.applyCoupon(token, scapiBasketId, couponLI.getCouponCode());
            } catch (couponErr) {
                Logger.warn(
                    "Failed to apply coupon {0} to SCAPI basket: {1}",
                    couponLI.getCouponCode(),
                    couponErr.message
                );
            }
        }
    }

    return scapiResponse;
};

/**
 * Applies a coupon to the SCAPI basket.
 *
 * @param {string} token - Bearer access token
 * @param {string} basketId - SCAPI basket ID
 * @param {string} couponCode - Coupon code to apply
 * @returns {Object} updated basket
 */
exports.applyCoupon = function (token, basketId, couponCode) {
    var url = getBaseUrl() + "/" + basketId + "/coupons" + siteParam();
    var body = { code: couponCode };
    return callService(token, "POST", url, body);
};

/**
 * Sets the shipping address on a SCAPI basket shipment.
 * The modifyPUTResponse hook enriches the response with c_shippingOptions and c_subtotalCents.
 *
 * @param {string} token - Bearer access token
 * @param {string} basketId - SCAPI basket ID
 * @param {string} shipmentId - Shipment ID
 * @param {Object} address - { firstName, lastName, address1, address2, city, stateCode, postalCode, countryCode, phone }
 * @returns {Object} enriched basket response with c_shippingOptions and c_subtotalCents
 */
exports.setShippingAddress = function (token, basketId, shipmentId, address) {
    var url =
        getBaseUrl() +
        "/" +
        basketId +
        "/shipments/" +
        shipmentId +
        "/shipping-address" +
        siteParam() +
        "&useAsBilling=true";
    var body = {
        first_name: address.firstName,
        last_name: address.lastName,
        address1: address.address1,
        address2: address.address2 || "",
        city: address.city,
        state_code: address.stateCode,
        postal_code: address.postalCode,
        country_code: address.countryCode,
        phone: address.phone || "",
    };
    return callService(token, "PUT", url, body);
};
