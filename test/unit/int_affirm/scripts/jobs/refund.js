var assert = require('chai').assert;
var Status = require('../../../../mocks/dw/system/Status');

var refund = require('../../../filesProxyquire').refund;

describe('int_affirm/cartridge/scripts/jobs/refund', function () {
    it('should be an Object', function () {
        assert.isObject(refund);
    });
    context('method execute', function () {
        it('should return OK status if process went without errors', function () {
            var actual = refund.execute();
            assert.isTrue(actual instanceof Status);
            assert.equal(actual.status, Status.OK);
        });
    });
});

