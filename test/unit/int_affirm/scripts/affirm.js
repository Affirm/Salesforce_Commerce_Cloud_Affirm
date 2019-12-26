var assert = require('chai').assert;
var affirmData = require('../../filesProxyquire').affirmData;
var affirmUtils = require('../../filesProxyquire').affirmUtils;
var affirmBasket = require('../../filesProxyquire').affirmBasket;
var affirmOrder = require('../../filesProxyquire').affirmOrder;

var affirm = require('../../filesProxyquire').affirm;

describe('int_affirm/cartridge/scripts/affirm', function () {
    it('isObject', function () {
        assert.isObject(affirm);
    });

    it('should include basket, data order, utils keys', function () {
        assert.hasAllKeys(affirm, ['data', 'utils', 'basket', 'order']);
    });

    it('should contain references to relevant affirm scripts objects', function () {
        assert.equal(affirm.data.constructor.name, affirmData.constructor.name);
        assert.equal(affirm.basket.constructor.name, affirmBasket.constructor.name);
        assert.equal(affirm.order.constructor.name, affirmOrder.constructor.name);
        assert.equal(affirm.utils.constructor.name, affirmUtils.constructor.name);
    });
});
