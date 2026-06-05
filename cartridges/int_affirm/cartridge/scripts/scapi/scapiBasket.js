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
 * Safely stringifies a value for debug logging.
 *
 * @param {*} value - Value to stringify
 * @returns {string} JSON string or fallback string
 */
function stringifyForLog(value) {
    if (value === null || typeof value === "undefined") {
        return "";
    }

    try {
        return JSON.stringify(value);
    } catch (e) {
        return String(value);
    }
}

/**
 * Quotes a value for a shell-safe curl command.
 *
 * @param {*} value - Value to quote
 * @returns {string} single-quoted shell value
 */
function shellQuote(value) {
    return "'" + String(value || "").replace(/'/g, "'\\''") + "'";
}

/**
 * Builds a one-line curl command for reproducing a SCAPI request.
 *
 * @param {string} method - HTTP method
 * @param {string} url - Full URL
 * @param {Object} headers - Request headers
 * @param {string|null} payload - Request payload
 * @returns {string} curl command
 */
function buildCurlCommand(method, url, headers, payload) {
    var command = ["curl", "-i", "-X", shellQuote(method), shellQuote(url)];
    Object.keys(headers).forEach(function (headerName) {
        command.push(
            "-H",
            shellQuote(headerName + ": " + headers[headerName])
        );
    });

    if (payload) {
        command.push("--data", shellQuote(payload));
    }

    return command.join(" ");
}

/**
 * Reads response headers from the SFCC HTTP client when available.
 *
 * @param {Object} resp - SFCC HTTP client response
 * @returns {string} serialized response headers
 */
function getResponseHeadersForLog(resp) {
    try {
        if (resp.responseHeaders) {
            return stringifyForLog(resp.responseHeaders);
        }

        if (resp.getResponseHeaders) {
            return stringifyForLog(resp.getResponseHeaders());
        }
    } catch (e) {
        return "Unable to read response headers: " + e.message;
    }

    return "";
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
    var requestPayload = body ? stringifyForLog(body) : null;
    var requestHeaders = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
    };
    var service = LocalServiceRegistry.createService("affirm.scapi.basket", {
        createRequest: function (svc) {
            svc.setURL(url);
            svc.setRequestMethod(method);
            Object.keys(requestHeaders).forEach(function (headerName) {
                svc.addHeader(headerName, requestHeaders[headerName]);
            });
            if (requestPayload) {
                return requestPayload;
            }
            return null;
        },
        parseResponse: function (svc, resp) {
            Logger.debug(
                "SCAPI response [{0} {1}] status={2} {3} headers={4} payload={5}",
                method,
                url,
                resp.statusCode,
                resp.statusMessage || "",
                getResponseHeadersForLog(resp),
                resp.text || ""
            );
            if (resp.text) {
                return JSON.parse(resp.text);
            }
            return null;
        },
        filterLogMessage: function (msg) {
            return msg;
        },
    });

    Logger.debug(
        "SCAPI request [{0} {1}] headers={2} payload={3}",
        method,
        url,
        stringifyForLog(requestHeaders),
        requestPayload || ""
    );
    Logger.debug(
        "SCAPI curl [{0} {1}]: {2}",
        method,
        url,
        buildCurlCommand(method, url, requestHeaders, requestPayload)
    );

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

    Logger.debug("SCAPI response OK: {0} {1}", method, url);
    return result.object;
}

/**
 * Creates a new SCAPI basket with the given product items.
 *
 * @param {string} token - Bearer access token
 * @param {Array} items - Array of { productId, quantity } objects
 * @returns {Object} basket data including basket_id and shipments
 */
exports.createBasketWithItems = function (token, items) {
    var url = getBaseUrl() + siteParam();
    var productItems = items.map(function (item) {
        return {
            product_id: item.productId,
            quantity: item.quantity,
        };
    });

    var body = {
        product_items: productItems,
    };

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

