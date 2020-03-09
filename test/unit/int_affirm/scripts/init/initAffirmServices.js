var assert = require('chai').assert;

var initAffirmServices = require('../../../filesProxyquire').initAffirmServices;

describe('int_affirm/cartridge/scripts/init/initAffirmServices', function () {
    it('is Object', function () {
        assert.isObject(initAffirmServices);
    });

    context('initService', function () {
        var initService = initAffirmServices.initService;
        var actual = initService('TestService');
        it('is Function', function () {
            assert.isFunction(initService);
        });
        it('should return service function', function () {
            assert.isFunction(actual);
            var result = actual.call({
                checkout_token: 'token1'
            }).object;
            assert.equal(result.name, 'TestService');
            assert.containsAllKeys(result, 'createRequest', 'parseResponse', 'filterLogMessage');
        });
    });
});
