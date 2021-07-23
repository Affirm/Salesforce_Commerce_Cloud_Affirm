var assert = require('chai').assert;
var Order = require('../../../../mocks/dw/order/Order');
var Response = require('../../../../mocks/AffirmResponse');
var PaymentProcessor = require('../../../../mocks/dw/order/PaymentProcessor');
var PaymentInstrument = require('../../../../mocks/dw/order/OrderPaymentInstrument');
var OrderMgr = require('../../../../mocks/dw/order/OrderMgr');

var affirmOrder = require('../../../filesProxyquire').affirmOrder;

describe('int_affirm/cartridge/scripts/order/affirmOrder', function () {
    it('is Object', function () {
        assert.isObject(affirmOrder);
    });

    var response = new Response(140);
    var paymentProcessor = new PaymentProcessor();
    var paymentInstrument = new PaymentInstrument();

    context('method updateAttributes', function () {
        var testOrder = new Order();
        affirmOrder.updateAttributes(testOrder, response, paymentProcessor, paymentInstrument);
        it('should copy data from Affirm response object to paymentInstrument', function () {
            var transaction = paymentInstrument.paymentTransaction;
            assert.include(transaction, { transactionID: response.events[0].id });
            assert.equal(transaction.amount.getValue(), response.amount / 100);
            assert.isObject(transaction.paymentProcessor);
        });
        it('should copy data from Affirm response object to order custom properties', function () {
            assert.include(testOrder.custom, {
                AffirmToken: response.events[0].id,
                AffirmExternalId: response.id,
                AffirmStatus: 'AUTH'
            });
            assert.isString(testOrder.custom.AffirmPaymentAction);
            assert.equal(testOrder.custom.AffirmPaymentAction, 'AUTH');
        });
    });

    context('method orderCanceledVoid', function () {
        var order = new Order();
        affirmOrder.updateAttributes(order, response, paymentProcessor, paymentInstrument);
        affirmOrder.orderCanceledVoid(order);
        it('should update order.custom.AffirmStatus', function () {
            assert.equal(order.custom.AffirmStatus, 'VOIDED');
        });
    });

    context('method authOrder', function () {
        it('should return charge object by token', function () {
            var actual = affirmOrder.authOrder('TOKEN');
            assert.isObject(actual);
            assert.include(actual, {
                name: 'affirm.auth',
                checkout_token: 'TOKEN'
            });
            assert.containsAllKeys(actual, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });

    context('method captureOrder', function () {
        it('should return caputre event object', function () {
            var actual = affirmOrder.captureOrder('chargeId', 'captureData');
            assert.isObject(actual);
            assert.include(actual, {
                name: 'affirm.capture',
                order_id: 'captureData'
            });
            assert.containsAllKeys(actual, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });

    context('method voidOrder', function () {
        it('should return charge void event object', function () {
            var actual = affirmOrder.voidOrder('chargeId');
            assert.isObject(actual);
            assert.include(actual, {
                name: 'affirm.void'
            });
            assert.containsAllKeys(actual, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });

    context('method captureOrders', function () {
        it('should launch capture service and update orders afirm status', function () {
            affirmOrder.captureOrders();
            var order = OrderMgr.getOrder('orderMgrTestOrder');
            assert.include(order, {
                status: Order.ORDER_STATUS_COMPLETED,
                paymentStatus: Order.PAYMENT_STATUS_PAID
            });
            assert.equal(order.custom.AffirmStatus, 'CAPTURE');
        });
    });

    OrderMgr.resetDefaultOrder();

    context('method voidOrders', function () {
        it('should launch void service and set affirm status VOIDED', function () {
            affirmOrder.voidOrders();
            var order = OrderMgr.getOrder('orderMgrTestOrder');
            assert.equal(order.custom.AffirmStatus, 'VOIDED');
        });
    });

    OrderMgr.resetDefaultOrder();

    context('method refundOrders', function () {
        it('should launch refund service and set affirm status REFUNDED', function () {
            affirmOrder.refundOrders();
            var order = OrderMgr.getOrder('orderMgrTestOrder');
            assert.equal(order.custom.AffirmStatus, 'REFUNDED');
        });
    });

    OrderMgr.resetDefaultOrder();

    global.dw = { system: require('../../../../mocks/dw/system') };

    context('method trackOrderConfirmed', function () {
        var actual = affirmOrder.trackOrderConfirmed('orderMgrTestOrder');
        it('should return order information object for orderconfirmation page', function () {
            assert.isObject(actual);
            assert.hasAllKeys(actual.orderInfo, ['orderId', 'currency', 'paymentMethod', 'total']);
        });
    });
});
