var Basket = require('./Basket');
var BasketMgr = function () {};

var basketKeepingMode = false;
var basket = new Basket();

BasketMgr.setTestBasketKeepingMode = function (boolean) {
    if (boolean) {
        basket = new Basket();
    }
    basketKeepingMode = boolean;
};

BasketMgr.getTestBasketKeepingMode = function () {
    return basketKeepingMode;
};
BasketMgr.currentBasket = null;
BasketMgr.currentOrNewBasket = null;
BasketMgr.storedBasket = null;

BasketMgr.createAgentBasket = function () {};
BasketMgr.createBasketFromOrder = function () {};
BasketMgr.deleteBasket = function () {};
BasketMgr.getBasket = function () {};
BasketMgr.getBaskets = function () {};
BasketMgr.getCurrentBasket = function () { return basketKeepingMode ? basket : new Basket(); };
BasketMgr.getCurrentOrNewBasket = function () {
    if (basketKeepingMode) {
        if (basket) {
            return basket;
        }
    }
    return new Basket();
};
BasketMgr.getStoredBasket = function () {};

module.exports = BasketMgr;
