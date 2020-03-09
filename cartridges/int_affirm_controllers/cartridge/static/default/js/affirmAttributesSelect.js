$(function () {
    document.addEventListener('affirm-checkout-button-rendered', function () {
        setAffirmButtonDisplayMode();

        $('.product-option').on('change', function (e) {
            var $select = $(this);
            var optionToChange = affirmItems[0].options.productOptions.find(function(option){
                return option.optionId === $select.data('affirm-name')});
            var $selectedOption = $select.find('option:selected').first();
            var newValue = optionToChange.availableValues.find(function(value){
                return value.valueId === $selectedOption.val();
            })
            var prevValue = optionToChange.availableValues.find(function(value){
                return value.valueId === optionToChange.selectedValueId;
            })
            var priceDifference = newValue.valuePrice - prevValue.valuePrice;

            optionToChange.selectedValueId = newValue.valueId
                affirmItems[0].unit_price += priceDifference;

            setAffirmButtonDisplayMode();
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

