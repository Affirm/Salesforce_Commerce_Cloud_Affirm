$(function () {
    document.addEventListener('affirm-checkout-button-rendered', function () {
        setAffirmButtonDisplayMode();
        $('.product-option').on('change', function (e) {
            var $select = $(this);
            affirmItems[0].options.productOptions.forEach(function (productOpt) {
                if (productOpt.optionId === $select.data('affirm-name')) {
                    var $selectedOption = $select.find('option:selected').first();
                    productOpt.selectedValueId = $selectedOption.val();

                    var combinedValueString = $selectedOption.data('combined').substring(1).replace(',', '');
                    affirmItems[0].unit_price = Math.round(Number(combinedValueString) * 100);
                }
            });
            setAffirmButtonDisplayMode();
        });
    });
});


/**
 * Hides Affirm Express Checkout Button if basket amount is not within Affirm allowed range; Enables Prequal Express Checkout
 */
function setAffirmButtonDisplayMode() {
    if (validateAmount()) {
        $('#js-affirm-checkout-now').show();
        if (isPrequalOnline) {
            affirm.ui.ready(function() {
                affirm.promo.onClick('.affirm-as-low-as' , validateRequiredOptions )
            })
        }
        affirm.ui.refresh()
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

