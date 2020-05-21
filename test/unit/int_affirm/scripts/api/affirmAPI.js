var assert = require('chai').assert;

var affirmAPI = require('../../../filesProxyquire').affirmAPI;

describe('int_affirm/cartridge/scripts/api/affirmApi', function () {
    it('is Object', function () {
        assert.isObject(affirmAPI);
    });

    context('method auth', function () {
        it('should return charge object by token', function () {
            var actual = affirmAPI.auth('TOKEN');
            assert.isObject(actual);
            assert.include(actual, {
                name: 'affirm.auth',
                checkout_token: 'TOKEN'
            });
            assert.containsAllKeys(actual, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });

    context('method capture', function () {
        it('should return caputre event object', function () {
            var actual = affirmAPI.capture('chargeId', 'captureData');
            assert.isObject(actual);
            assert.include(actual, {
                name: 'affirm.capture',
                order_id: 'captureData'
            });
            assert.containsAllKeys(actual, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });

    context('method void', function () {
        it('should return charge void event object', function () {
            var actual = affirmAPI.void('chargeId');
            assert.isObject(actual);
            assert.include(actual, {
                name: 'affirm.void'
            });
            assert.containsAllKeys(actual, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });

    context('method refund', function () {
        it('should return charge by chargeID', function () {
            var actual = affirmAPI.refund('chargeId');
            assert.isObject(actual);
            assert.include(actual, {
                name: 'affirm.refund'
            });
            assert.containsAllKeys(actual, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });

    context('method update', function () {
        it('should return charge update event object', function () {
            var actual = affirmAPI.update('chargeId', { updateData: 'updateData' });
            assert.isObject(actual);
            assert.include(actual, {
                name: 'affirm.update',
                updateData: 'updateData'
            });
            assert.containsAllKeys(actual, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });
});
