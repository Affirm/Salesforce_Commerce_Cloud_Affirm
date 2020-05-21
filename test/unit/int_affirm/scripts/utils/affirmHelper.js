var assert = require('chai').assert;
var Basket = require('../../../../mocks/dw/order/Basket');
var Order = require('../../../../mocks/dw/order/Order');
var Status = require('../../../../mocks/dw/system/Status');
var PaymentMethod = require('../../../../mocks/dw/order/PaymentMethod');

var affirmHelper = require('../../../filesProxyquire').affirmHelper;

describe('int_affirm/cartridge/scripts/utils/affirmHelper', function () {
    it('isObject', function () {
        assert.isObject(affirmHelper);
    });

    context('method CheckCart', function () {
        it('should return return status without errors if cart is valid', function () {
            var cart = new Basket();
            var sfraFlag = true;
            var actual = affirmHelper.CheckCart(cart, sfraFlag);
            assert.isObject(actual);
            assert.doesNotHaveAnyKeys(actual.status, ['error']);
        });
    });

    context('method PostProcess', function () {
        var order = new Order();
        var actual = affirmHelper.PostProcess(order);
        it('should launch order capture update order status', function () {
            assert.equal(order.getPaymentStatus(), Order.PAYMENT_STATUS_PAID);
            assert.equal(order.getStatus(), Order.ORDER_STATUS_COMPLETED);
        });
        it('should return OK status if no errors occured', function () {
            assert.isObject(actual);
            assert.equal(actual.status, Status.OK);
        });
    });

    context('method Redirect', function () {
        it('should return true if PaymentMethod is Affirm and Affirm is on', function () {
            assert.isTrue(affirmHelper.Redirect());
        });
    });

    context('method Init', function () {
        it('should return true if PaymentMethod is Affirm and Affirm is on', function () {
            var basket = new Basket();
            var applicablePaymentMethods = [new PaymentMethod('Affirm'), new PaymentMethod('CreditCard'), new PaymentMethod('DebitCard')];
            applicablePaymentMethods.remove = function (object) {
                return this.filter(function (item) { return item.ID !== object.ID; });
            };
            var actual = affirmHelper.Init(basket, applicablePaymentMethods);
            assert.isArray(actual);
            assert.lengthOf(actual, 3);
            var idArr = actual.map(function (method) { return method.ID; });
            assert.sameMembers(idArr, ['Affirm', 'CreditCard', 'DebitCard']);
        });
    });

    context('method IsAffirmApplicable', function () {
        it('should return true if all pre-conditions for Affirm usage are fullfilled', function () {
            assert.isTrue(affirmHelper.IsAffirmApplicable());
        });
    });

    context('method getNonGiftCertificateAmount', function () {
        it('should return cart amount with excluded gift Certificates ammount', function () {
            var basket = new Basket();
            basket.setTestValuesForGiftCertPaymentInstruments();
            var actual = affirmHelper.getNonGiftCertificateAmount(basket);
            assert.equal(actual.getValue(), 125);
        });
    });
});
