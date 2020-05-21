var assert = require('chai').assert;
var Status = require('../../../../mocks/dw/system/Status');

var fullprocess = require('../../../filesProxyquire').fullprocess;

describe('int_affirm/cartridge/scripts/jobs/fullprocess', function () {
    it('should be an Object', function () {
        assert.isObject(fullprocess);
    });
    context('method execute', function () {
        it('should return OK status if process went without errors', function () {
            var actual = fullprocess.execute();
            assert.isTrue(actual instanceof Status);
            assert.equal(actual.status, Status.OK);
        });
    });
});

