'use strict';

function setCurrencyAndGoToURL(currency, url) {
    $.ajax({
        dataType: 'json',
        url: url,
        data: {
            format: 'ajax',
            currencyMnemonic: currency
        }
    })
        .success(function () {
            location.reload();
        });
}

function initialize() {
    $('.country-selector').on('change', function () {
        var url = $(this).data('url');
        var currency = $(this).data('currency');
        setCurrencyAndGoToURL(currency, url);
    });
}

$(document).ready(function () {
    initialize();
});
