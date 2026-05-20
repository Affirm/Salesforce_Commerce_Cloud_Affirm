"use strict";

var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry");
var StringUtils = require("dw/util/StringUtils");
var Logger = require("dw/system/Logger").getLogger("affirm", "slasAuth");
var affirmData = require("*/cartridge/scripts/data/affirmData");

/**
 * Obtains a SLAS guest access token via client_credentials grant.
 *
 * @returns {{ access_token: string, expires_in: number }} token payload
 * @throws {Error} when the service call fails
 */
exports.getGuestToken = function () {
    var shortCode = affirmData.getSCAPIShortCode();
    var orgId = affirmData.getSCAPIOrgId();
    var siteId = affirmData.getSCAPISiteId();
    var clientId = affirmData.getSLASClientId();
    var clientSecret = affirmData.getSLASClientSecret();

    var url =
        "https://" +
        shortCode +
        ".api.commercecloud.salesforce.com" +
        "/shopper/auth/v1/organizations/" +
        orgId +
        "/oauth2/token";

    var service = LocalServiceRegistry.createService("affirm.slas.auth", {
        createRequest: function (svc) {
            svc.setURL(url);
            svc.setRequestMethod("POST");
            svc.addHeader("Content-Type", "application/x-www-form-urlencoded");
            svc.addHeader(
                "Authorization",
                "Basic " +
                    StringUtils.encodeBase64(clientId + ":" + clientSecret),
            );
            return (
                "grant_type=client_credentials&channel_id=" +
                encodeURIComponent(siteId)
            );
        },
        parseResponse: function (svc, resp) {
            return JSON.parse(resp.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        },
    });

    var result = service.call();
    if (!result.ok) {
        Logger.error("SLAS auth failed: {0}", result.errorMessage);
        throw new Error("SLAS auth failed: " + result.errorMessage);
    }

    return result.object;
};

/**
 * Exchanges a refresh token for a new access token (same guest identity).
 *
 * @param {string} refreshToken - The refresh token from a previous getGuestToken call
 * @returns {{ access_token: string, refresh_token: string, expires_in: number }} token payload
 * @throws {Error} when the service call fails
 */
exports.refreshAccessToken = function (refreshToken) {
    var shortCode = affirmData.getSCAPIShortCode();
    var orgId = affirmData.getSCAPIOrgId();
    var clientId = affirmData.getSLASClientId();
    var clientSecret = affirmData.getSLASClientSecret();

    var url =
        "https://" +
        shortCode +
        ".api.commercecloud.salesforce.com" +
        "/shopper/auth/v1/organizations/" +
        orgId +
        "/oauth2/token";

    var service = LocalServiceRegistry.createService("affirm.slas.auth", {
        createRequest: function (svc) {
            svc.setURL(url);
            svc.setRequestMethod("POST");
            svc.addHeader("Content-Type", "application/x-www-form-urlencoded");
            svc.addHeader(
                "Authorization",
                "Basic " +
                    StringUtils.encodeBase64(clientId + ":" + clientSecret),
            );
            return (
                "grant_type=refresh_token&refresh_token=" +
                encodeURIComponent(refreshToken)
            );
        },
        parseResponse: function (svc, resp) {
            return JSON.parse(resp.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        },
    });

    var result = service.call();
    if (!result.ok) {
        Logger.error("SLAS refresh failed: {0}", result.errorMessage);
        throw new Error("SLAS refresh failed: " + result.errorMessage);
    }

    return result.object;
};

