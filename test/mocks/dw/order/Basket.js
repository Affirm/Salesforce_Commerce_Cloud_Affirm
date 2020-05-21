/**
 * Represents dw.order.Basket
 */

var LineItemCtnr = require('./LineItemCtnr');
var Basket = function () {};

Basket.prototype = Object.create(LineItemCtnr.prototype);

Basket.prototype.agentBasket = null; // boolean
Basket.prototype.inventoryReservationExpiry = null; // Date
Basket.prototype.orderBeingEdited = null; // Order
Basket.prototype.orderNoBeingEdited = null; // String

Basket.prototype.getInventoryReservationExpiry = function () {}; // Date
Basket.prototype.getOrderBeingEdited = function () {}; // Order
Basket.prototype.getOrderNoBeingEdited = function () {}; // String
Basket.prototype.isAgentBasket = function () {}; // boolean
Basket.prototype.releaseInventory = function () {}; // Status
Basket.prototype.reserveInventory = function () {}; // Status
Basket.prototype.reserveInventory = function (reservationDurationInMinutes) {}; // Status
Basket.prototype.reserveInventory = function (reservationDurationInMinutes, removeIfNotAvailable) {}; // Status
Basket.prototype.setBusinessType = function (aType) {}; // void
// Possible values are LineItemCtnr.BUSINESS_TYPE_B2C or LineItemCtnr.BUSINESS_TYPE_B2B.
Basket.prototype.setChannelType = function (aType) {}; // void
Basket.prototype.setCustomerNo = function (customerNo) {}; // void
Basket.prototype.startCheckout = function () {}; // void
Basket.prototype.updateCurrency = function () {}; // void

module.exports = Basket;
