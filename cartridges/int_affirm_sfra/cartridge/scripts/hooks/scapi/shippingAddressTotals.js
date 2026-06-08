"use strict";

var ShippingMgr = require("dw/order/ShippingMgr");
var HookMgr = require("dw/system/HookMgr");
var Logger = require("dw/system/Logger").getLogger(
    "Affirm",
    "shippingAddressTotals"
);

/**
 * SCAPI hook: dw.ocapi.shop.basket.shipment.shipping_address.afterPUT
 *
 * Runs inside a transactional context so that external tax providers
 * (Vertex, Avalara, etc.) honour the calculate call and return live tax
 * values for each shipping method.  Results are stored on request.custom
 * so the read-only modifyPUTResponse hook can attach them to the response.
 *
 * @param {dw.order.Basket} basket - the basket based on which the order is created
 * @param {dw.order.Shipment} shipment - the shipment information for the shipment creation
 * @param {OrderAddress} shippingAddress - the shipping address that was set to the shipment (OrderAddressWO — plain properties, no getters)
 */
exports.afterPUT = function (basket, shipment, shippingAddress) {
    try {
        Logger.debug("afterPUT hook invoked");

        if (!basket || !basket.custom || basket.custom.isAffirmExpressCheckout !== true) {
            Logger.debug("isAffirmExpressCheckout is not true, exiting");
            return;
        }

        if (!shippingAddress) {
            Logger.debug("No shipping address provided, exiting");
            return;
        }

        // shippingAddress is an OrderAddressWO — use plain property access
        var addressObj = {
            countryCode: shippingAddress.countryCode || "US",
            stateCode: shippingAddress.stateCode || "",
            postalCode: shippingAddress.postalCode || "",
            city: shippingAddress.city || "",
        };

        Logger.debug(
            "Address: country={0}, state={1}, zip={2}, city={3}",
            addressObj.countryCode,
            addressObj.stateCode,
            addressObj.postalCode,
            addressObj.city
        );

        var applicableShippingMethods =
            ShippingMgr.getShipmentShippingModel(
                shipment
            ).getApplicableShippingMethods(addressObj);
        var currentShippingMethod =
            shipment.getShippingMethod() ||
            ShippingMgr.getDefaultShippingMethod();

        Logger.debug(
            "Found {0} applicable shipping methods, current method: {1}",
            applicableShippingMethods.length,
            currentShippingMethod ? currentShippingMethod.getID() : "none"
        );

        var shippingOptions = [];
        var subtotalCents = Math.round(
            basket.getAdjustedMerchandizeTotalPrice(true).getValue() * 100
        );

        for (var i = 0; i < applicableShippingMethods.length; i++) {
            var shippingMethod = applicableShippingMethods[i];

            try {
                shipment.setShippingMethod(shippingMethod);
                HookMgr.callHook("dw.order.calculate", "calculate", basket);

                var shippingAmount = Math.round(
                    basket.getAdjustedShippingTotalPrice().getValue() * 100
                );
                var taxAmount = Math.round(
                    basket.getTotalTax().getValue() * 100
                );
                var totalAmount = Math.round(
                    basket.getTotalGrossPrice().getValue() * 100
                );

                Logger.debug(
                    "Shipping method {0}: shipping={1}, tax={2}, total={3}",
                    shippingMethod.getID(),
                    shippingAmount,
                    taxAmount,
                    totalAmount
                );

                shippingOptions.push({
                    shipping_type: shippingMethod.getID(),
                    shipping_label: shippingMethod.getDisplayName(),
                    shipping_amount: shippingAmount,
                    tax_amount: taxAmount,
                    total: totalAmount,
                });
            } finally {
                shipment.setShippingMethod(currentShippingMethod);
                HookMgr.callHook("dw.order.calculate", "calculate", basket);
            }
        }

        var result = {
            shippingOptions: shippingOptions,
            subtotalCents: subtotalCents,
        };

        request.custom.affirmShippingTotals = JSON.stringify(result);

        Logger.debug(
            "afterPUT complete: {0} shipping options, subtotal={1}",
            result.shippingOptions.length,
            result.subtotalCents
        );
    } catch (e) {
        Logger.error("shippingAddressTotals afterPUT error: {0}", e.message);
    }
};

/**
 * SCAPI hook: dw.ocapi.shop.basket.shipment.shipping_address.modifyPUTResponse
 *
 * Read-only hook that retrieves pre-calculated shipping totals from
 * request.custom (populated by afterPUT) and attaches them to the
 * SCAPI response.
 *
 * @param {dw.order.Basket} basket - The basket being modified
 * @param {Object} basketResponse - The SCAPI response object to enrich
 * @param {Object} orderAddressRequest - The SCAPI order address request
 */
exports.modifyPUTResponse = function (basket, basketResponse, orderAddressRequest) {
    try {
        Logger.debug("modifyPUTResponse hook invoked");

        if (!basket || !basket.custom || basket.custom.isAffirmExpressCheckout !== true) {
            Logger.debug("isAffirmExpressCheckout is not true, exiting");
            return;
        }

        var raw = request.custom.affirmShippingTotals; // eslint-disable-line no-undef
        if (!raw) {
            Logger.debug(
                "No affirmShippingTotals found on request.custom, exiting"
            );
            return;
        }

        var data = JSON.parse(raw);
        basketResponse.c_shippingOptions = data.shippingOptions;
        basketResponse.c_subtotalCents = data.subtotalCents;

        Logger.debug(
            "modifyPUTResponse attached {0} shipping options, subtotal={1}",
            data.shippingOptions.length,
            data.subtotalCents
        );
    } catch (e) {
        Logger.error(
            "shippingAddressTotals modifyPUTResponse error: {0}",
            e.message
        );
    }
};
