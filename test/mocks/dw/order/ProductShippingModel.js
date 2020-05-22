var ProductShippingCost = require('./ProductShippingCost');
var ProductShippingModel = function () {};

ProductShippingModel.prototype.getApplicableShippingMethods = function () {};
ProductShippingModel.prototype.getInapplicableShippingMethods = function () {};
ProductShippingModel.prototype.getShippingMethodsWithShippingCost = function () {};
ProductShippingModel.prototype.getShippingCost = function () { return new ProductShippingCost(); };
ProductShippingModel.prototype.applicableShippingMethods = null;
ProductShippingModel.prototype.inapplicableShippingMethods = null;
ProductShippingModel.prototype.shippingMethodsWithShippingCost = null;
ProductShippingModel.prototype.shippingCost = null;

module.exports = ProductShippingModel;
