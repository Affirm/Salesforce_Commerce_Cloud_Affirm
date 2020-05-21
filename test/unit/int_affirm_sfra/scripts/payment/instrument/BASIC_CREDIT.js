var assert = require('chai').assert;
var Basket = require('../../../../../mocks/dw/order/Basket');

var BASIC_CREDIT = require('../../../../filesProxyquire').BASIC_CREDIT_SFRA;

describe('int_affirm_sfra/cartridge/scripts/payment/instrument/BASIC_CREDIT', function () {
    it('isObject', function () {
        assert.isObject(BASIC_CREDIT);
    });

    context('method add', function () {
        var testRequest = {
            'billing_address[city]': 'TestCity',
            'billing_address[line1]': 'TestAddress1',
            'billing_address[line2]': 'TestAddress2',
            'billing_address[state]': 'TestState',
            'billing_address[zipcode]': 'TestZipCode',
            number: '1111111111111111',
            cardholder_name: 'TestUser',
            cvv: 'ZDF&18307',
            expiration: '0222'
        };

        global.request.setupTestHttpParameterMap(testRequest);
        it('should return PaymentInstrument object with card data', function () {
            var basket = new Basket();
            var actual = BASIC_CREDIT.add(basket);
            assert.isObject(actual);
            assert.equal(actual.constructor.name, 'PaymentInstrument');
            assert.equal(actual.creditCardHolder, 'TestUser');
            assert.equal(actual.creditCardNumber, '1111111111111111');
            assert.equal(actual.creditCardType, 'Visa');
            assert.equal(actual.creditCardExpirationMonth, '02');
            assert.equal(actual.creditCardExpirationYear, '2022');
        });
    });
});
