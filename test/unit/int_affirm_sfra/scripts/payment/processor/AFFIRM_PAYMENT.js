var assert = require('chai').assert;
var PaymentInstrument = require('../../../../../mocks/dw/order/OrderPaymentInstrument');
var PaymentProcessor = require('../../../../../mocks/dw/order/PaymentProcessor');

var AFFIRM_PAYMENT = require('../../../../filesProxyquire').AFFIRM_PAYMENT_SFRA;


describe('int_affirm_sfra/cartridge/scripts/payment/processor/AFFIRM_PAYMENT', function () {
    it('isObject', function () {
        assert.isObject(AFFIRM_PAYMENT);
    });

    context('method Authorize', function () {
        var paymentInstrument = new PaymentInstrument('TestPI', 125);
        paymentInstrument.setTestCustomProp('affirmed', true);

        var paymentProcessor = new PaymentProcessor();

        global.session.setTestCustomProp('affirmResponseID', 'afRspID');
        global.session.setTestCustomProp('affirmFirstEventID', 'afFstEvID');
        global.session.setTestCustomProp('affirmAmount', 'afAmnt');
        var actual = AFFIRM_PAYMENT.Authorize('orderMgrTestOrder', paymentInstrument, paymentProcessor);
        it('should return object with authorized: true status', function () {
            assert.isObject(actual);
            assert.isEmpty(actual.fieldErrors);
            assert.isEmpty(actual.serverErrors);
            assert.isFalse(actual.error);
        });
        it('should update paymentTrasaction', function () {
            assert.equal(paymentInstrument.paymentTransaction.transactionID, 'afFstEvID');
        });
    });

    context('method Handle', function () {
        it('should create Payment instrument for current basket and return success status', function () {
            var actual = AFFIRM_PAYMENT.Handle();
            assert.isObject(actual);
            assert.isEmpty(actual.fieldErrors);
            assert.isEmpty(actual.serverErrors);
            assert.isFalse(actual.error);
        });
    });
});
