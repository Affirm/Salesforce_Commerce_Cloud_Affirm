var ShippingMethod = function (ID) {
    this.ID = ID;
    this.displayName = ID;
};


ShippingMethod.prototype.getCurrencyCode = function () {};
ShippingMethod.prototype.getDisplayName = function () { return this.ID; };
ShippingMethod.prototype.getID = function () { return this.ID; };
ShippingMethod.prototype.getDescription = function () {};
ShippingMethod.prototype.isOnline = function () {};
ShippingMethod.prototype.getTaxClassID = function () {};
ShippingMethod.prototype.getBaseMethod = function () {};
ShippingMethod.prototype.isDefaultMethod = function () {};
ShippingMethod.prototype.getDependentMethods = function () {};
ShippingMethod.prototype.currencyCode = null;
ShippingMethod.prototype.displayName = null;
ShippingMethod.prototype.ID = null;
ShippingMethod.prototype.description = null;
ShippingMethod.prototype.taxClassID = null;
ShippingMethod.prototype.baseMethod = null;
ShippingMethod.prototype.dependentMethods = null;

module.exports = ShippingMethod;
