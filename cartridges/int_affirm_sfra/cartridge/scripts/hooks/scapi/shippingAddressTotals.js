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
        if (!basket || !basket.custom || basket.custom.isAffirmExpressCheckout !== true) {
            return;
        }

        if (!shippingAddress) {
            return;
        }

        // shippingAddress is an OrderAddressWO — use plain property access
        var addressObj = {
            address1 : shippingAddress.address1 || "",
            address2 : shippingAddress.address2 || "",
            countryCode: shippingAddress.countryCode || "US",
            stateCode: shippingAddress.stateCode || "",
            postalCode: shippingAddress.postalCode || "",
            city: shippingAddress.city || "",
        };

        var applicableShippingMethods =
            ShippingMgr.getShipmentShippingModel(
                shipment
            ).getApplicableShippingMethods(addressObj);
        var currentShippingMethod =
            shipment.getShippingMethod() ||
            ShippingMgr.getDefaultShippingMethod();

        var shippingOptions = [];

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

                shippingOptions.push({
                    shipping_type: shippingMethod.getID(),
                    shipping_label: shippingMethod.getDisplayName(),
                    shipping_amount: shippingAmount,
                    tax_amount: taxAmount,
                    total: totalAmount,
                });
            } catch (e) {
                Logger.error(
                    "shippingAddressTotals afterPUT error: {0}",
                    e.message
                );
            } finally {
                shipment.setShippingMethod(currentShippingMethod);
                HookMgr.callHook("dw.order.calculate", "calculate", basket);
            }
        }

        var subtotalCents = Math.round(
            basket.getAdjustedMerchandizeTotalPrice(true).getValue() * 100
        );

        // Affirm currently preselects the first shipping method in the array
        // So we need to move the user's selected (or site default) shipping method to the front
        if (currentShippingMethod) {
            var preferredId = currentShippingMethod.getID();
            var preferredIdx = -1;
            for (var j = 0; j < shippingOptions.length; j++) {
                if (shippingOptions[j].shipping_type === preferredId) {
                    preferredIdx = j;
                    break;
                }
            }
            if (preferredIdx > 0) {
                var preferredOption = shippingOptions.splice(preferredIdx, 1)[0];
                shippingOptions.unshift(preferredOption);
            }
        }

        var result = {
            shippingOptions: shippingOptions,
            subtotalCents: subtotalCents,
        };

        request.custom.affirmShippingTotals = JSON.stringify(result);
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
        if (!basket || !basket.custom || basket.custom.isAffirmExpressCheckout !== true) {
            return;
        }

        var raw = request.custom.affirmShippingTotals;
        if (!raw) {
            return;
        }

        var data = JSON.parse(raw);
        basketResponse.c_shippingOptions = data.shippingOptions;
        basketResponse.c_subtotalCents = data.subtotalCents;
    } catch (e) {
        Logger.error(
            "shippingAddressTotals modifyPUTResponse error: {0}",
            e.message
        );
    }
};
