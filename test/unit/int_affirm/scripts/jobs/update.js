var assert = require('chai').assert;
var Status = require('../../../../mocks/dw/system/Status');

var update = require('../../../filesProxyquire').update;

describe('int_affirm/cartridge/scripts/jobs/update', function () {
    it('should be an Object', function () {
        assert.isObject(update);
    });
    context('method execute', function () {
        it('should return OK status if process went without errors', function () {
            var actual = update.execute();
            assert.isTrue(actual instanceof Status);
            assert.equal(actual.status, Status.OK);
        });
    });
});

