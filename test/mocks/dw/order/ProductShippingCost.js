var Money = require('../value/Money');
var ProductShippingCost = function () {};

ProductShippingCost.prototype.getAmount = function () { return new Money(10); };
ProductShippingCost.prototype.isFixedPrice = function () {};
ProductShippingCost.prototype.isSurcharge = function () { return false; };
ProductShippingCost.prototype.amount = null;

module.exports = ProductShippingCost;
