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
 * Adds envent listener to track quantity changes on cart page and update affirmItems quantities
 */
function quantityEventListener() {
    $('.quantity-form .quantity').on('change', function () {
        var $pQuantity = $(this);
        var affirmItem = affirmItems.find(function (item) {
            return item.sku === $pQuantity.data('pid');
        });
        affirmItem.qty = parseInt($pQuantity.val());

        setAffirmButtonDisplayMode();
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
    quantityEventListener: quantityEventListener,
    setAffirmButtonDisplayMode: setAffirmButtonDisplayMode
};
