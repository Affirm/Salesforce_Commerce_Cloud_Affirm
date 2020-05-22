var ProductShippingModel = require('./ProductShippingModel');
var ShipmentShippingModel = require('./ShipmentShippingModel');
var ShippingMgr = function () {};

ShippingMgr.getShippingCost = function () {};
ShippingMgr.getProductShippingModel = function () { return new ProductShippingModel(); };
ShippingMgr.getShipmentShippingModel = function () { return new ShipmentShippingModel(); };
ShippingMgr.getAllShippingMethods = function () {};
ShippingMgr.getDefaultShippingMethod = function () {};
ShippingMgr.applyShippingCost = function () {};
ShippingMgr.prototype.shippingCost = null;
ShippingMgr.prototype.productShippingModel = null;
ShippingMgr.prototype.shipmentShippingModel = null;
ShippingMgr.prototype.allShippingMethods = null;
ShippingMgr.prototype.defaultShippingMethod = null;

module.exports = ShippingMgr;
