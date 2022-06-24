var assert = require('chai').assert;
var Basket = require('../../../../mocks/dw/order/Basket');
var PaymentMethod = require('../../../../mocks/dw/order/PaymentMethod');
var OrderPaymentInstrument = require('../../../../mocks/dw/order/OrderPaymentInstrument');
var Status = require('../../../../mocks/dw/system/Status');
var AffirmResponse = require('../../../../mocks/AffirmResponse');

var affirmBasket = require('../../../filesProxyquire').affirmBasket;

describe('int_affirm/cartridge/scripts/basket/affirmBasket', function () {
    it('isObject', function () {
        assert.isObject(affirmBasket);
    });

    context('method getShippingAddress', function () {
        it('should return shippingContact object', function () {
            var basket = new Basket();
            var actual = affirmBasket.getShippingAddress(basket);
            assert.isObject(actual);
            assert.hasAllKeys(actual, ['name', 'address']);
            assert.hasAllKeys(actual.name, ['first', 'last', 'full']);
            assert.hasAllKeys(actual.address, ['street1', 'street2', 'city', 'region1_code', 'postal_code', 'country']);
        });
    });

    context('method getBillingAddress', function () {
        it('should return billingContact object', function () {
            var basket = new Basket();
            var actual = affirmBasket.getBillingAddress(basket);
            assert.isObject(actual);
            assert.hasAllKeys(actual, ['name', 'address', 'phone_number', 'email']);
            assert.hasAllKeys(actual.name, ['first', 'last', 'full']);
            assert.hasAllKeys(actual.address, ['street1', 'street2', 'city', 'region1_code', 'postal_code', 'country']);
        });
    });

    context('method getItems', function () {
        it('should return array that contains product items data', function () {
            var basket = new Basket();
            var actual = affirmBasket.getItems(basket);
            assert.isArray(actual);
            actual.forEach(function (obj) {
                assert.isObject(obj);
                assert.hasAllKeys(obj, ['display_name', 'sku', 'unit_price', 'qty', 'item_image_url', 'item_url', 'categories']);
            });
        });
    });

    context('method validatePayments', function () {
        it('should return array with Affirm payment method if nothing contradicts its usage', function () {
            var basket = new Basket();
            var applicablePaymentMethods = [new PaymentMethod('Affirm'), new PaymentMethod('CreditCard'), new PaymentMethod('DebitCard')];
            applicablePaymentMethods.remove = function (object) {
                return this.filter(function (item) { return item.ID !== object.ID; });
            };
            var actual = affirmBasket.validatePayments(basket, applicablePaymentMethods);
            assert.isArray(actual);
            assert.lengthOf(actual, 3);
            var idArr = actual.map(function (method) { return method.ID; });
            assert.sameMembers(idArr, ['Affirm', 'CreditCard', 'DebitCard']);
        });
    });

    context('method getMerchant', function () {
        it('should return merchant object with cancel_url adapted for sfra if parmeter flag is true', function () {
            var actual = affirmBasket.getMerchant(true);
            assert.isObject(actual);
            assert.hasAllKeys(actual, ['user_confirmation_url', 'user_cancel_url', 'user_confirmation_url_action']);
            assert.equal(actual.user_cancel_url, 'https://mywebsite/Checkout-Begin');
        });
        it('should return merchant object with controllers cancel_url if parmeter flag is false', function () {
            var actual = affirmBasket.getMerchant(false);
            assert.isObject(actual);
            assert.hasAllKeys(actual, ['user_confirmation_url', 'user_cancel_url', 'user_confirmation_url_action']);
            assert.equal(actual.user_cancel_url, 'https://mywebsite/COBilling-Start');
        });
    });

    context('method getMetadata', function () {
        it('should return metadata object', function () {
            var basket = new Basket();
            var actual = affirmBasket.getMetadata(basket);
            assert.isObject(actual);
            assert.include(actual, { platform_version: '19.1' });
            assert.include(actual, { shipping_type: 'GroundDelivery' });
            assert.include(actual, { platform_type: 'metadata.platform_type' });
            assert.include(actual, { platform_affirm: 'metadata.platform_affirm' });
        });
    });

    context('method getShippingAmmount', function () {
        it('should return metadata object', function () {
            var basket = new Basket();
            var actual = affirmBasket.getShippingAmmout(basket);
            assert.isNumber(actual);
            assert.equal(actual, 800);
        });
    });

    context('method getTaxAmount', function () {
        it('should return value number of total basket taxes', function () {
            var basket = new Basket();
            var actual = affirmBasket.getTaxAmount(basket);
            assert.isNumber(actual);
            assert.equal(actual, 700);
        });
    });

    context('method getTotal', function () {
        it('should return value number of total basket amount without Gift Certificates', function () {
            var basket = new Basket();
            basket.setTestValuesForGiftCertPaymentInstruments();
            var actual = affirmBasket.getTotal(basket);
            assert.isNumber(actual);
            assert.equal(actual, 12500);
        });
    });

    context('method createPaymentInstrument', function () {
        var basket = new Basket();
        it('should replace full amount Affirm PaymentInstrument with new on updated by Gift Certificates amount', function () {
            basket.setTestValuesForGiftCertPaymentInstruments();
            assert.lengthOf(basket.getPaymentInstruments(), 3);
            assert.equal(basket.getPaymentInstruments('Affirm')[0].paymentTransaction.amount.getValue(), 140);
            affirmBasket.createPaymentInstrument(basket);
            assert.lengthOf(basket.getPaymentInstruments(), 3);
            assert.equal(basket.getPaymentInstruments('Affirm')[0].paymentTransaction.amount.getValue(), 125);
        });
        it('should return a newly created PaymentInstrument', function () {
            var actual = affirmBasket.createPaymentInstrument(basket);
            assert.isObject(actual);
            assert.isTrue(actual instanceof OrderPaymentInstrument);
        });
    });

    context('method removePaymentInstrument', function () {
        it('should return value number of total basket amount without Gift Certificates', function () {
            var basket = new Basket();
            assert.lengthOf(basket.getPaymentInstruments(), 3);
            assert.lengthOf(basket.getPaymentInstruments('Affirm'), 1);
            affirmBasket.removePaymentInstrument(basket);
            assert.lengthOf(basket.getPaymentInstruments(), 2);
            assert.lengthOf(basket.getPaymentInstruments('Affirm'), 0);
        });
    });

    context('method getCheckout', function () {
        it('should return object with checkout data', function () {
            var basket = new Basket();
            var actual = affirmBasket.getCheckout(null, basket);
            assert.isString(actual);
            assert.containsAllKeys(JSON.parse(actual), 'merchant', 'items', 'billing', 'discounts', 'metadata', 'shipping_amount', 'tax_amount', 'total');
        });
    });

    context('method syncBasket', function () {
        it('should return dw.system.Status with result of Affirm and Basket object comparison', function () {
            var basket = new Basket();
            var response = new AffirmResponse(140);
            var actual = affirmBasket.syncBasket(basket, response);
            assert.isObject(actual);
            assert.isTrue(actual instanceof Status);
        });
    });
});
