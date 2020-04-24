var assert = require('chai').assert;
var Client = require('../../../../mocks/Client');

var jobUtils = require('../../../filesProxyquire').jobUtils;

describe('int_affirm/cartridge/scripts/utils/jobUtils', function () {
    it('isObject', function () {
        assert.isObject(jobUtils);
    });

    context('method responseParser', function () {
        var client;
        beforeEach(function () {
            client = new Client(200);
        });

        it('should return object with \'error\' and \'response\' fields', function () {
            var actual = jobUtils.responseParser(null, client);
            assert.isObject(actual);
            assert.containsAllKeys(actual, ['error', 'response'], 'Response must include necessary keys');
            assert.isObject(actual.response, 'result.response property must be an object');
        });

        it('should return object with error:false property for statusCode 200', function () {
            assert.isFalse(jobUtils.responseParser(null, client).error);
        });

        it('should return object with error:true property for statusCode 40*', function () {
            assert.isTrue(jobUtils.responseParser(null, new Client(400)).error);
            assert.isTrue(jobUtils.responseParser(null, new Client(401)).error);
            assert.isTrue(jobUtils.responseParser(null, new Client(404)).error);
        });
    });
});
