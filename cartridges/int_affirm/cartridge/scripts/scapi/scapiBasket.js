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
 * Creates a new SCAPI basket with product items from the given basket.
 *
 * @param {string} token - Bearer access token
 * @param {dw.order.Basket} basket - SFCC basket to copy product items from
 * @param {Object} customAttributes - SCAPI basket custom attributes to set during creation
 * @returns {Object} basket data including basket_id and shipments
 */
exports.createBasket = function (token, basket, customAttributes) {
    var url = getBaseUrl() + siteParam();
    var productItems = [];

    if (!basket || !basket.productLineItems) {
        return {
            product_items: productItems,
        };
    }

    basket.productLineItems.toArray().forEach(function (productLineItem) {
        if (productLineItem.optionProductLineItem) {
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

    var body = {
        product_items: productItems,
    };

    if (customAttributes) {
        Object.keys(customAttributes).forEach(function (key) {
            body[key] = customAttributes[key];
        });
    }

    return callService(token, "POST", url, body);
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

/**
 * Deletes a SCAPI basket (best-effort cleanup).
 *
 * @param {string} token - Bearer access token
 * @param {string} basketId - SCAPI basket ID
 */
exports.deleteBasket = function (token, basketId) {
    var url = getBaseUrl() + "/" + basketId + siteParam();
    try {
        callService(token, "DELETE", url, null);
    } catch (e) {
        Logger.warn(
            "Failed to delete SCAPI basket {0}: {1}",
            basketId,
            e.message
        );
    }
};



