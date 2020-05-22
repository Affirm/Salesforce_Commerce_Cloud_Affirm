var assert = require('chai').assert;
var Request = require('../../../../../mocks/dw/system/Request');

var formProcessor = require('../../../../filesProxyquire').affirm_form_processor;

describe('int_affirm_sfra/cartridge/scripts/payment/processor/affirm_form_processor.js', function () {
    it('isObject', function () {
        assert.isObject(formProcessor);
    });

    context('method processForm', function () {
        it('should return object with updated viewData', function () {
            var req = new Request();
            req.form = {};
            req.currentCustomer = { raw: 'testUser' };
            req.geolocation = { countryCode: 111111 };
            var paymentForm = {
                paymentMethod: { value: 'METHOD_CREDIT_CARD' }
            };
            var actual = formProcessor.processForm(req, paymentForm, {});
            assert.isObject(actual);
            assert.isFalse(actual.error);
            assert.include(actual.viewData.paymentMethod, { value: 'METHOD_CREDIT_CARD', htmlName: 'METHOD_CREDIT_CARD' });
            assert.include(actual.viewData.paymentInformation.cardType, { value: 'TestCardType' });
        });
    });
});
