var assert = require('chai').assert;
var PaymentInstrument = require('../../../../../mocks/dw/order/OrderPaymentInstrument');

var AFFIRM_PAYMENT = require('../../../../filesProxyquire').AFFIRM_PAYMENT;


describe('int_affirm_controllers/cartridge/scripts/payment/processor/AFFIRM_PAYMENT', function () {
    it('isObject', function () {
        assert.isObject(AFFIRM_PAYMENT);
    });

    context('method Authorize', function () {
        var args = {};
        args.OrderNo = 'orderMgrTestOrder';
        args.PaymentInstrument = new PaymentInstrument('TestPI', 125);
        args.PaymentInstrument.setTestCustomProp('affirmed', true);

        global.session.setTestCustomProp('affirmResponseID', 'afRspID');
        global.session.setTestCustomProp('affirmFirstEventID', 'afFstEvID');
        global.session.setTestCustomProp('affirmAmount', 'afAmnt');
        var actual = AFFIRM_PAYMENT.Authorize(args);
        it('should return object with authorized: true status', function () {
            assert.isObject(actual);
            assert.isTrue(actual.authorized);
        });
        it('should update paymentTrasaction', function () {
            var pi = args.PaymentInstrument;
            assert.equal(pi.paymentTransaction.transactionID, 'afFstEvID');
        });
    });

    context('method Handle', function () {
        it('should create Payment instrument for current basket and return success status', function () {
            var actual = AFFIRM_PAYMENT.Handle();
            assert.isObject(actual);
            assert.isTrue(actual.success);
        });
    });
});
