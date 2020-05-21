$(function () {
    $(document).on('click', '.place-order', function (e) {
    	if ($('.payment-information').data('payment-method-id') !== 'Affirm') {
    		return true;
    	}
    	if (!$('#vcn-data').data('affirmselected') || window.vcn_approved) {
            return true;
        }
        var checkoutObject = $('#vcn-data').data('vcndata');
        if ($('#vcn-data').data('enabled')) {
        	var $thisBtn = $(this);
        	$('#vcn-data').data('vcncomplete', 'true');
        	e.preventDefault();
            affirm.checkout.open_vcn({
                success: function (card_details) {
                    $.ajax({
                        url: $('#vcn-data').data('updateurl') + '?' + $('#vcn-data').data('csrfname') + '=' + $('#vcn-data').data('csrftoken'),
                        data: card_details,
                        dataType: 'json',
                        method: 'POST',
                        success: function (response) {
                            if (!response.error) {
                                window.vcn_approved = true;
                                $thisBtn.click();
                            } else if ($('div.error-form').length) {
                                $('div.error-form').text($('#vcn-data').data('errormessages').default);
                            } else {
                                $('table.item-list').before('<div class=\'error-form\'>' + $('#vcn-data').data('errormessages').default + '</div>');
                            }
                        },
                        error: function (error) {
                            $('table.item-list').before('<div class="error-form">Error in establishing connection with Affirm VCN service!</div>');
                        },
                        done: function () {}
                    });
                },
                error: function (error) {
                    if (error.reason == 'canceled' || error.reason == 'closed') {
                        window.location.assign($('#vcn-data').data('errorurl'));
                        return;
                    }
                    var errorText = '';
                    var errorCollection = $('#vcn-data').data('errormessages');
                    errorText = errorCollection[error.reason] || errorCollection.default;
                    if ($('div.error-form').length) {
                        $('div.error-form').text(errorText);
                    } else {
                        $('table.item-list').before('<div class=\'error-form\'>' + errorText + '</div>');
                    }
                },
                checkout_data: checkoutObject
            });
        } else if (checkoutObject.metadata.mode == 'modal') {
            e.preventDefault();
            affirm.checkout(checkoutObject);
            affirm.checkout.open({
                onFail: function (a) {
                    window.location.assign(checkoutObject.merchant.user_cancel_url);
                },
                onSuccess: function (data) {
                	 var csrftoken = $('#vcn-data').data('csrfname') + '=' + $('#vcn-data').data('csrftoken');
					 var url = checkoutObject.merchant.user_confirmation_url + '?checkout_token=' + data.checkout_token + '&' + csrftoken;
					 window.location.assign(url);
                }
            });
        } else {
            e.preventDefault();
            affirm.checkout(checkoutObject);
            affirm.checkout.post();
        }
    });
    $(document).on('product:afterAttributeSelect', function (data, container) {
    	var newPrice = null;
    	var product = container.data.product;
    	if (product.price.sales) {
    		newPrice = product.price.sales.value;
    	} else if (product.price.list) {
    		newPrice = product.price.list.value;
    	} else if (product.price.startingFromPrice) {
    		newPrice = product.price.startingFromPrice.sales.value;
    	}
    	$('.affirm-as-low-as').attr('data-amount', (newPrice * 100).toFixed());
        if (typeof affirm.ui.refresh !== 'undefined') {
            affirm.ui.refresh();
        }
    });
    $(document).on('checkout:updateCheckoutView', function (e, data) {
    	$('.affirm-product-modal').attr('data-amount', (data.order.totals.grandTotal.substr(1) * 100).toFixed());
        if (typeof affirm.ui.refresh !== 'undefined') {
            affirm.ui.refresh();
        }
    });
    affirm.ui.ready(
        function () {
            affirm.ui.error.on('close', function () {
                window.location.replace($('#vcn-data').data('errorurl'));
            });
        }
    );
});
