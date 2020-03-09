'use strict';

/**
 * Hides Affirm Express Checkout Button if product(or products in set) are not available
 * for purchase
 */
function setAffirmButtonDisplayMode() {
    var productAvailable = $('.global-availability').toArray().every(function (item) {
        return $(item).data('available') && $(item).data('ready-to-order');
    });

    var amountIsValid = validateAmount();
    var enable = productAvailable && amountIsValid;
    if (enable) {
        $('#quickview-affirm-container').show();
    } else {
        $('#quickview-affirm-container').hide();
    }
}

/**
 * As far as quantity change for bundles unlike any other PDPs doesn't trigger product:afterAttributeSelect event, update of affirmItem quantity is handled by change event listener
 *
 */
function trackQuantity() {
    $('#quantity-1').on('change', function () {
        affirmItems[0].qty = parseInt($(this).val());
        setAffirmButtonDisplayMode()
    });
}

/**
 * In existing sfra implementation modal popUp is run by Bootstrap JS Modal simultaniously both by data-* attributes and $(#element).modal() commands
 * this leads to inconsistent results when operating with modal window content after 'shown.bs.modal' event
 * This function removes modal state control by data-* attributes to trigger 'shown.bs.modal' event only when modal content is loaded (refer ot quickView client script in app_storefront_base cartridge)
 */
function normalizeQuickViewModalPopUp(){
    $('.quickview.hidden-sm-down').removeAttr('data-toggle');
    $('.quickview.hidden-sm-down').removeAttr('data-target');
    $('.quickview.hidden-sm-down').on('click', function (e) {
        e.preventDefault();
        $.spinner().start();
    });
}

/**
 * Includes remote template with Affrim express checkout button in modal after it has been shown
 */
function renderAffrimButton() {
    $('body').on('shown.bs.modal', '#quickViewModal', function () {
        $.spinner().stop();
        var $container = $('#quickview-affirm-container').first();
        if ($container.length !== 0) {
            $.ajax({
                url: $container.data('url'),
                method: 'GET',
                success: function (response) {
                    $container.html(response);
                    setAffirmButtonDisplayMode();
                    trackQuantity();
                }
            });
        }
    });
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
        affirmItem.unit_price = Math.round(updatedProduct.price.sales.value * 100);
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
    renderAffrimButton: renderAffrimButton,
    updateAffirmItems: updateAffirmItems,
    normalizeQuickViewModalPopUp: normalizeQuickViewModalPopUp
};
