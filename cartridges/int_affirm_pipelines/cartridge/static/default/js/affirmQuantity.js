'use strict';

$(function () {
    document.addEventListener('affirm-checkout-button-rendered', function () {
        var $singleProdQty = $('#Quantity')
        var $multipleProdQty = $('.product-set-item input[name=Quantity]')
        if ($singleProdQty.length > 0) {
            $singleProdQty.each(function(i, elem){ // after attribute select on PDP affirmItems re-rendered but quantity input may contain some value
                updateItemsQuantitySingleProduct(elem)
            }) 
            $singleProdQty.on('change', function () {
                updateItemsQuantitySingleProduct(this)
            });
        } else if ($multipleProdQty.length > 0) {
            $multipleProdQty.each(function(i, elem){ // after attribute select on PDP affirmItems re-rendered but quantity input may contain some value
                updateItemsQuantityWithinArray(elem)
            }) 
           $multipleProdQty.on('change', function () {
                updateItemsQuantityWithinArray(this)
            });
        }
    });
});

/**
 * Copies value from quantity input on PDP to affirmItems object
 */
function updateItemsQuantitySingleProduct(qtyInputDOMelement) {
    affirmItems[0].qty = parseInt(qtyInputDOMelement.value)
    setAffirmButtonDisplayMode()
}

/**
 * Copies value from specific quantity input in product set to item in affirmItems array
 */
function updateItemsQuantityWithinArray(qtyInputDOMelement) {
    var $setItem = $(qtyInputDOMelement).closest('.product-set-item');
    var id = $setItem.find('input[name=pid]').first().val();
    var affirmItem = affirmItems.find(function (item) {
        return item.sku === id;
    });

    affirmItem.qty = parseInt($(qtyInputDOMelement).val());
    if ($('#add-all-to-cart').attr('disabled') !== 'disabled') {
        setAffirmButtonDisplayMode()
    }
}


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

