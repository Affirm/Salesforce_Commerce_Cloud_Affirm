var assert = require('chai').assert;
var Status = require('../../../../mocks/dw/system/Status');


var capture = require('../../../filesProxyquire').capture;

describe('int_affirm/cartridge/scripts/jobs/capture', function () {
    it('should be an Object', function () {
        assert.isObject(capture);
    });
    context('method execute', function () {
        it('should return OK status if capture went without errors', function () {
            var actual = capture.execute();
            assert.isTrue(actual instanceof Status);
            assert.equal(actual.status, Status.OK);
        });
    });
});

