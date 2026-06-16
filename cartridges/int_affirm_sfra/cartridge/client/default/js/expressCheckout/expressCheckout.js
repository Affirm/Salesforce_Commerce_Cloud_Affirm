"use strict";

/**
 * Express Checkout module: starts Affirm checkout from a button click (e.g. cart or PDP)
 * without going through the full checkout flow.
 */

/**
 * Starts the express checkout flow for the given button/container.
 * Fetches checkout data from the server and opens the Affirm checkout modal.
 * @param {jQuery} $container - The jQuery object representing the container of the button/container.
 */
function initiateExpressCheckout($container) {
    var url = $container.data("express-url");
    if (!url) return;

    var pid = $container.data("pid");
    var quantity = $container.data("quantity");
    if (pid) {
        url += "?pid=" + encodeURIComponent(pid);
        if (quantity) {
            url += "&quantity=" + encodeURIComponent(quantity);
        }
    }

    $.ajax({
        url: url,
        method: "GET",
        dataType: "json",
        success: function (data) {
            if (data.error) {
                if (typeof affirm !== "undefined") {
                    affirm.ui.error({
                        title: "Checkout Unavailable",
                        body: "Unable to start Affirm Express Checkout. Please try again.",
                    });
                }
                return;
            }

            if (data.checkoutObject && typeof affirm !== "undefined") {
                affirm.checkout(data.checkoutObject);
                affirm.checkout.open();
            }
        },
        error: function (xhr, status, err) {
            if (typeof affirm !== "undefined") {
                affirm.ui.error({
                    title: "Checkout Unavailable",
                    body: "Unable to start Affirm Express Checkout. Please try again.",
                });
            }
        }
    });
}

module.exports = {
    init: function () {
        $("body").on("click", ".affirm-express-checkout", function (e) {
            e.preventDefault();
            initiateExpressCheckout($(this));
        });

        if (
            typeof affirm !== "undefined" &&
            affirm.ui &&
            affirm.ui.checkoutButton
        ) {
            affirm.ui.checkoutButton.render();
        }
    }
};
