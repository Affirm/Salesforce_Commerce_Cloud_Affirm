'use strict';

/**
 * Hides Affirm Express Checkout Button if product(or products in set) are not available
 * for purchase or if amount is not within Affirm allowed range
 */
function setAffirmButtonDisplayMode() {
    var productAvailable = $('.product-availability').toArray().every(function (item) {
        return $(item).data('available') && $(item).data('ready-to-order');
    });
    var amountIsValid = validateAmount();
    var enable = productAvailable && amountIsValid;
    if (enable) {
        $('#js-affirm-checkout-now').show();
        if (isPrequalOnline) {
            affirm.ui.ready(function() {
                affirm.promo.onClick('.affirm-as-low-as' , validateRequiredOptions )
            })
		}
    } else {
        $('#js-affirm-checkout-now').hide();
    }
}

/**
 * After product attribute change on PDP copies updated product details from server response to affirmItems object
 *
 */
function updateAffirmItems() {
    $('body').on('product:afterAttributeSelect', function (e, response) {
        var updatedProduct = response.data.product;

        var index = affirmItems.length === 1 ? 0 : $('.set-item').index(response.container); // if it's product Set page, affirmItem is found by Product-Variation request container index among set-items
        var affirmItem = affirmItems[index];
        affirmItem.unit_price = updatedProduct.price.type === 'range' ? Math.round(updatedProduct.price.max.sales.value * 100) : affirmItem.unit_price = Math.round(updatedProduct.price.sales.value * 100);        
        affirmItem.qty = updatedProduct.selectedQuantity;
        affirmItem.sku = updatedProduct.id;

        var updatedProductOptions = [];
        updatedProduct.options.forEach(function (opt) {
            updatedProductOptions.push({
                optionId: opt.id,
                selectedValueId: opt.selectedValueId
            });
        });
        affirmItem.options.productOptions = updatedProductOptions;

        setAffirmButtonDisplayMode();
    });
}

/**
 * As far as quantity change for bundles unlike any other PDPs doesn't trigger product:afterAttributeSelect event, update of affirmItem quantity is handled by change event listener
 *
 */
function updateBundleQuantity() {
    $('#quantity-null').on('change', function () {
        affirmItems[0].qty = parseInt($(this).val());
        setAffirmButtonDisplayMode()
    });
}

/**
 * Validates if current affirmItems amount is within limit allowed for Affirm payment
 * @param {Array} affirmItems items that are stored for express checkout button
 * @returns {boolean} if amount is valid
 */
function validateAmount() {
    if (affirmItems) {
        var amount = affirmItems.reduce(function(total, item){
            return total + (item.unit_price * item.qty)/100
        },0);
        
        return amount >= affirmLimits.min && amount <= affirmLimits.max
    }
}

module.exports = {
    setAffirmButtonDisplayMode: setAffirmButtonDisplayMode,
    updateAffirmItems: updateAffirmItems,
    updateBundleQuantity: updateBundleQuantity
};
