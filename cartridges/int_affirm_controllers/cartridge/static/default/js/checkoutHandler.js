$(function () {
    $(document).on('click', '.order-summary-footer button.button-fancy-large', function (e) {
        if (!$('#vcn-data').data('affirmselected') || window.vcn_approved) {
            return true;
        }
        var checkoutObject = $('#vcn-data').data('vcndata');
        if ($('#vcn-data').data('enabled')) {
            var $thisBtn = $(this);
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
                                $('table.item-list').before('<div class="error-form">' + $('#vcn-data').data('errormessages').default + '</div>');
                            }
                        },
                        error: function (error) {
                            $('table.item-list').before('<div class="error-form">Error in establishing connection with Affirm VCN service!</div>');
                            return;
                        }
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
                        $('table.item-list').before('<div class="error-form">' + errorText + '</div>');
                    }
                },
                checkout_data: checkoutObject
            });
        } else if (checkoutObject.metadata.mode == 'modal') {
            e.preventDefault();
            affirm.checkout(checkoutObject);
            affirm.checkout.open({
                onFail: function (error) {
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
            var csrftoken = $('#vcn-data').data('csrfname') + '=' + $('#vcn-data').data('csrftoken');
            checkoutObject.merchant.user_confirmation_url = checkoutObject.merchant.user_confirmation_url + '?' + csrftoken;
            affirm.checkout(checkoutObject);
            affirm.checkout.post();
        }
    });

    if (typeof affirm !== 'undefined') {
        affirm.ui.ready(
		    function () {
                if ($('#affirm-inline-container').length > 0) {
                    var inlineCheckoutObject = $('#inline-checkout-data').data('inlinecheckoutdata');
                    affirm.checkout(inlineCheckoutObject);
                    affirm.checkout.inline({containerId: 'affirm-inline-container'});
                }
		        affirm.ui.error.on('close', function () {
		            window.location.replace($('#vcn-data').data('errorurl'));
		        });
		    }
        );
    }
});
