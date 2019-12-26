var assert = require('chai').assert;
var Status = require('../../../../mocks/dw/system/Status');

var voidJob = require('../../../filesProxyquire').void;

describe('int_affirm/cartridge/scripts/jobs/void', function () {
    it('should be an Object', function () {
        assert.isObject(voidJob);
    });
    context('method execute', function () {
        it('should return OK status if process went without errors', function () {
            var actual = voidJob.execute();
            assert.isTrue(actual instanceof Status);
            assert.equal(actual.status, Status.OK);
        });
    });
});

