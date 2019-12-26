'use strict';

$(function () {
    document.addEventListener('affirm-checkout-button-rendered', function () {
        $('#Quantity').on('change', function (e) {
            affirmItems[0].qty = parseInt($(this).val());
            setAffirmButtonDisplayMode()
        });

        $('.product-set-item input[name=Quantity]').on('change', function (e) {
            var $setItem = $(this).closest('.product-set-item');
            var id = $setItem.find('input[name=pid]').first().val();
            var affirmItem = affirmItems.find(function (item) {
                return item.sku === id;
            });

            affirmItem.qty = parseInt($(this).val());
            setAffirmButtonDisplayMode()
        });
    });
});


/**
 * Hides Affirm Express Checkout Button if basket amount is not within Affirm allowed range
 */
function setAffirmButtonDisplayMode() {
    if (validateAmount()) {
        $('#js-affirm-checkout-now').show();
    } else {
        $('#js-affirm-checkout-now').hide();
    }
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

