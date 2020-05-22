var assert = require('chai').assert;
var Basket = require('../../../mocks/dw/order/Basket');
var Customer = require('../../../mocks/dw/customer/Customer');

var payment = require('../../filesProxyquire').payment;

describe('int_affirm_sfra/cartridge/models/payment', function () {
    it('is Function', function () {
        assert.isFunction(payment);
    });

    it('should set to a global variable Payment Cards, Payment Instruments, Payment Methods', function () {
        var basket = new Basket();
        var customer = new Customer('testUser');
        var countryCode = '1123453';
        var testGlobal = {
            payment: payment
        };
        testGlobal.payment(basket, customer, countryCode);
        assert.isNotEmpty(testGlobal.applicablePaymentMethods);
        assert.isNotEmpty(testGlobal.applicablePaymentCards);
        assert.isNotEmpty(testGlobal.selectedPaymentInstruments);
    });
});
