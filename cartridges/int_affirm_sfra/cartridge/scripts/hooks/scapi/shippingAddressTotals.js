"use strict";

var ShippingMgr = require("dw/order/ShippingMgr");
var HookMgr = require("dw/system/HookMgr");
var Logger = require("dw/system/Logger").getLogger(
    "affirm",
    "shippingAddressTotals",
);

/**
 * SCAPI hook: dw.ocapi.shop.basket.shipment.shipping_address.modifyPUTResponse
 *
 * After a shipping address is set on a SCAPI basket, this hook calculates
 * shipping totals for all applicable shipping methods and enriches the
 * response with c_shippingOptions and c_subtotalCents.
 *
 * Runs inside the platform's transaction — no explicit Transaction.begin/rollback.
 * Sets each shipping method, calculates, captures totals, then restores original.
 *
 * @param {dw.order.Basket} basket - The basket being modified
 * @param {Object} basketResponse - The SCAPI response object to enrich
 */
exports.modifyPUTResponse = function (basket, basketResponse) {
    try {
        var shipment = basket.getDefaultShipment();
        if (!shipment) {
            return;
        }

        var shippingAddress = shipment.getShippingAddress();
        if (!shippingAddress) {
            return;
        }

        var addressObj = {
            countryCode: shippingAddress.getCountryCode().getValue() || "US",
            stateCode: shippingAddress.getStateCode() || "",
            postalCode: shippingAddress.getPostalCode() || "",
            city: shippingAddress.getCity() || "",
        };

        var applicableShippingMethods =
            ShippingMgr.getShipmentShippingModel(
                shipment,
            ).getApplicableShippingMethods(addressObj);
        var currentShippingMethod =
            shipment.getShippingMethod() ||
            ShippingMgr.getDefaultShippingMethod();
        var shippingOptions = [];

        for (var i = 0; i < applicableShippingMethods.length; i++) {
            var shippingMethod = applicableShippingMethods[i];

            shipment.setShippingMethod(shippingMethod);
            HookMgr.callHook("dw.order.calculate", "calculate", basket);

            var shippingAmount = Math.round(
                basket.getAdjustedShippingTotalPrice().getValue() * 100,
            );
            var taxAmount = Math.round(basket.getTotalTax().getValue() * 100);
            var totalAmount = Math.round(
                basket.getTotalGrossPrice().getValue() * 100,
            );

            shippingOptions.push({
                shipping_type: shippingMethod.getID(),
                shipping_label: shippingMethod.getDisplayName(),
                shipping_amount: shippingAmount,
                tax_amount: taxAmount,
                total: totalAmount,
            });
        }

        // Restore original shipping method
        if (currentShippingMethod) {
            shipment.setShippingMethod(currentShippingMethod);
        }
        HookMgr.callHook("dw.order.calculate", "calculate", basket);

        var subtotalCents = Math.round(
            basket.getAdjustedMerchandizeTotalPrice(true).getValue() * 100,
        );

        basketResponse.c_shippingOptions = shippingOptions;
        basketResponse.c_subtotalCents = subtotalCents;
    } catch (e) {
        Logger.error("shippingAddressTotals hook error: {0}", e.message);
    }
};

