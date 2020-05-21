/**
 * Represents dw.order.LineItemCtnr
 */
var Money = require('../value/Money');
var Iterator = require('../util/Iterator');
var ProductLineItem = require('../order/ProductLineItem');
var Product = require('../catalog/Product');
var OrderAddress = require('../order/OrderAddress');
var Shipment = require('./Shipment');
var OrderPaymentInstrument = require('./OrderPaymentInstrument');

var LineItemCtnr = function () {};

// variables needed for testing

var productLineItems = [new ProductLineItem(new Product('P123456', 75)), new ProductLineItem(new Product('pd65432', 65))];
productLineItems.iterator = function () { return new Iterator(this); };

var paymentInstruments = [new OrderPaymentInstrument('METHOD_BANK_TRANSFER', new Money(140, 'USD')), new OrderPaymentInstrument('METHOD_CREDIT_CARD', new Money(140, 'USD')), new OrderPaymentInstrument('Affirm', new Money(140, 'USD'))];
paymentInstruments.iterator = function () { return new Iterator(this); };
// Methods needed for testing
LineItemCtnr.prototype.setTestValuesForGiftCertPaymentInstruments = function () {
    this.giftCertificatePaymentInstruments = [new OrderPaymentInstrument('METHOD_GIFT_CERTIFICATE', new Money(10.0, 'USD')), new OrderPaymentInstrument('METHOD_GIFT_CERTIFICATE', new Money(5.0, 'USD'))];
};

// Class constants, properties and methods
LineItemCtnr.prototype.BUSINESS_TYPE_B2B = 2; // Number
LineItemCtnr.prototype.BUSINESS_TYPE_B2C = 1; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_CALLCENTER = 2; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_CUSTOMERSERVICECENTER = 11; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_DSS = 4; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_FACEBOOKADS = 8; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_INSTAGRAMCOMMERCE = 12; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_MARKETPLACE = 3; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_ONLINERESERVATION = 10; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_PINTEREST = 6; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_STORE = 5; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_STOREFRONT = 1; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_SUBSCRIPTIONS = 9; // Number
LineItemCtnr.prototype.CHANNEL_TYPE_TWITTER = 7; // Number

LineItemCtnr.prototype.adjustedMerchandizeTotalGrossPrice = null; // Money
LineItemCtnr.prototype.adjustedMerchandizeTotalNetPrice = null; // Money
LineItemCtnr.prototype.adjustedMerchandizeTotalPrice = null; // Money
LineItemCtnr.prototype.adjustedMerchandizeTotalTax = null; // Money
LineItemCtnr.prototype.adjustedShippingTotalGrossPrice = null; // Money
LineItemCtnr.prototype.adjustedShippingTotalNetPrice = null; // Money
LineItemCtnr.prototype.adjustedShippingTotalPrice = null; // Money
LineItemCtnr.prototype.adjustedShippingTotalTax = null; // Money
LineItemCtnr.prototype.allGiftCertificateLineItems = null; // Collection // DEPRECATED Use getGiftCertificateLineItems() to get the collection instead.
LineItemCtnr.prototype.allLineItems = null; // Collection
LineItemCtnr.prototype.allProductLineItems = null; // Collection
LineItemCtnr.prototype.allProductQuantities = null; // HashMap
LineItemCtnr.prototype.allShippingPriceAdjustments = null; // Collection
LineItemCtnr.prototype.billingAddress = null; // OrderAddress
LineItemCtnr.prototype.bonusDiscountLineItems = null; // Collection
LineItemCtnr.prototype.bonusLineItems = null; // Collection
LineItemCtnr.prototype.businessType = null; // EnumValue
// Possible values are BUSINESS_TYPE_B2C or BUSINESS_TYPE_B2B.
LineItemCtnr.prototype.channelType = null; // EnumValue
// Possible values are CHANNEL_TYPE_STOREFRONT, CHANNEL_TYPE_CALLCENTER, CHANNEL_TYPE_MARKETPLACE, CHANNEL_TYPE_DSS, CHANNEL_TYPE_STORE, CHANNEL_TYPE_PINTEREST, CHANNEL_TYPE_TWITTER, CHANNEL_TYPE_FACEBOOKADS, CHANNEL_TYPE_SUBSCRIPTIONS, CHANNEL_TYPE_ONLINERESERVATION or CHANNEL_TYPE_CUSTOMERSERVICECENTER.
LineItemCtnr.prototype.couponLineItems = [{ couponCode: 'testCouponLineItem1' }]; // Collection
LineItemCtnr.prototype.currencyCode = 'USD'; // String
LineItemCtnr.prototype.customer = null; // Customer
LineItemCtnr.prototype.customerNo = null; // String
LineItemCtnr.prototype.defaultShipment = null; // Shipment
LineItemCtnr.prototype.etag = null; // String
LineItemCtnr.prototype.giftCertificateLineItems = null; // Collection
LineItemCtnr.prototype.giftCertificatePaymentInstruments = []; // Collection
LineItemCtnr.prototype.giftCertificateTotalGrossPrice = null; // Money
LineItemCtnr.prototype.giftCertificateTotalNetPrice = null; // Money
LineItemCtnr.prototype.giftCertificateTotalPrice = null; // Money
LineItemCtnr.prototype.giftCertificateTotalTax = null; // Money
LineItemCtnr.prototype.merchandizeTotalGrossPrice = null; // Money
LineItemCtnr.prototype.merchandizeTotalNetPrice = null; // Money
LineItemCtnr.prototype.merchandizeTotalPrice = null; // Money
LineItemCtnr.prototype.merchandizeTotalTax = null; // Money
LineItemCtnr.prototype.notes = null; // List
LineItemCtnr.prototype.paymentInstrument = paymentInstruments[0]; // OrderPaymentInstrument
// Deprecated:
// Use getPaymentInstruments() or getGiftCertificatePaymentInstruments() to get the set of payment instruments.
LineItemCtnr.prototype.paymentInstruments = paymentInstruments; // Collection
LineItemCtnr.prototype.priceAdjustments = null; // Collection
LineItemCtnr.prototype.productLineItems = productLineItems; // Collection
LineItemCtnr.prototype.productQuantities = null; // HashMap
LineItemCtnr.prototype.productQuantityTotal = null; // Number
LineItemCtnr.prototype.shipments = null; // Collection
LineItemCtnr.prototype.shippingPriceAdjustments = null; // Collection
LineItemCtnr.prototype.shippingTotalGrossPrice = null; // Money
LineItemCtnr.prototype.shippingTotalNetPrice = null; // Money
LineItemCtnr.prototype.shippingTotalPrice = null; // Money
LineItemCtnr.prototype.shippingTotalTax = null; // Money
LineItemCtnr.prototype.totalGrossPrice = productLineItems.reduce(function (sum, pli) {
    return sum.add(pli.adjustedPrice);
}, new Money(0, 'USD')); // Money
LineItemCtnr.prototype.totalNetPrice = null; // Money
LineItemCtnr.prototype.totalTax = null; // Money

LineItemCtnr.prototype.addNote = function (subject, text) {}; // Note
LineItemCtnr.prototype.createBillingAddress = function () {
    this.billingAddress = new OrderAddress();
    return this.billingAddress;
}; // OrderAddress
LineItemCtnr.prototype.createBonusProductLineItem = function (bonusDiscountLineItem, product, optionModel, shipment) {}; // ProductLineItem
LineItemCtnr.prototype.createCouponLineItem = function (couponCode, campaignBased) {}; // CouponLineItem
LineItemCtnr.prototype.createCouponLineItem = function (couponCode) {}; // CouponLineItem
LineItemCtnr.prototype.createGiftCertificateLineItem = function (amount, recipientEmail) {}; // GiftCertificateLineItem
LineItemCtnr.prototype.createGiftCertificatePaymentInstrument = function (giftCertificateCode, amount) {}; // OrderPaymentInstrument
LineItemCtnr.prototype.createPaymentInstrument = function (paymentMethodId, amount) {
    var newIstrument = new OrderPaymentInstrument(paymentMethodId, amount);
    this.paymentInstruments[this.paymentInstruments.length] = newIstrument;
    return newIstrument;
}; // OrderPaymentInstrument
LineItemCtnr.prototype.createPaymentInstrumentFromWallet = function (walletPaymentInstrument, amount) {}; // OrderPaymentInstrument
LineItemCtnr.prototype.createPriceAdjustment = function (promotionID) {}; // PriceAdjustment
LineItemCtnr.prototype.createPriceAdjustment = function (promotionID, discount) {}; // PriceAdjustment
LineItemCtnr.prototype.createProductLineItem = function (productID, quantity, shipment) {}; // ProductLineItem
LineItemCtnr.prototype.createProductLineItem = function (productID, shipment) {}; // ProductLineItem
LineItemCtnr.prototype.createProductLineItem = function (productListItem, shipment) {}; // ProductLineItem
LineItemCtnr.prototype.createProductLineItem = function (product, optionModel, shipment) {}; // ProductLineItem
LineItemCtnr.prototype.createShipment = function (id) {}; // Shipment
LineItemCtnr.prototype.createShippingPriceAdjustment = function (promotionID) {}; // PriceAdjustment
LineItemCtnr.prototype.getAdjustedMerchandizeTotalGrossPrice = function () {}; // Money
LineItemCtnr.prototype.getAdjustedMerchandizeTotalNetPrice = function () {}; // Money
LineItemCtnr.prototype.getAdjustedMerchandizeTotalPrice = function (applyOrderLevelAdjustments) {
    var total = this.productLineItems.reduce(function (sum, pli) {
        return sum.add(pli.adjustedPrice);
    }, new Money(0, 'USD'));
    if (applyOrderLevelAdjustments) {
        var adjustments = this.giftCertificatePaymentInstruments.reduce(function (sum, orderPI) {
            return sum.add(orderPI.getPaymentTransaction().getAmount());
        }, new Money(0, 'USD'));
        total = total.subtract(adjustments);
    }
    return total;
}; // Money
LineItemCtnr.prototype.getAdjustedMerchandizeTotalTax = function () {}; // Money
LineItemCtnr.prototype.getAdjustedShippingTotalGrossPrice = function () {}; // Money
LineItemCtnr.prototype.getAdjustedShippingTotalNetPrice = function () {}; // Money
LineItemCtnr.prototype.getAdjustedShippingTotalPrice = function () {}; // Money
LineItemCtnr.prototype.getAdjustedShippingTotalTax = function () {}; // Money
LineItemCtnr.prototype.getAllGiftCertificateLineItems = function () {}; // Collection
LineItemCtnr.prototype.getAllLineItems = function () {}; // Collection
LineItemCtnr.prototype.getAllProductLineItems = function () { return productLineItems; }; // Collection
LineItemCtnr.prototype.getAllProductQuantities = function () {}; // HashMap
LineItemCtnr.prototype.getAllShippingPriceAdjustments = function () {}; // Collection
LineItemCtnr.prototype.getBillingAddress = function () { return this.billingAddress || new OrderAddress(); }; // OrderAddress
LineItemCtnr.prototype.getBonusDiscountLineItems = function () {}; // Collection
LineItemCtnr.prototype.getBonusLineItems = function () {}; // Collection
LineItemCtnr.prototype.getBusinessType = function () {}; // EnumValue
LineItemCtnr.prototype.getChannelType = function () {}; // EnumValue
LineItemCtnr.prototype.getCouponLineItem = function (couponCode) {}; // CouponLineItem
LineItemCtnr.prototype.getCouponLineItems = function () { return this.couponLineItems; }; // Collection
LineItemCtnr.prototype.getCurrencyCode = function () { return 'USD'; }; // String
LineItemCtnr.prototype.getCustomer = function () {}; // Customer
LineItemCtnr.prototype.getCustomerEmail = function () {}; // String
LineItemCtnr.prototype.getCustomerName = function () {}; // String
LineItemCtnr.prototype.getCustomerNo = function () {}; // String
LineItemCtnr.prototype.getDefaultShipment = function () { return new Shipment(); }; // Shipment
LineItemCtnr.prototype.getEtag = function () {}; // String
LineItemCtnr.prototype.getGiftCertificateLineItems = function () {
    var result = Array.from(this.giftCertificatePaymentInstruments);
    result.empty = result.length === 0;
    return result;
}; // Collection
LineItemCtnr.prototype.getGiftCertificatePaymentInstruments = function () {
    var array = this.giftCertificatePaymentInstruments;
    return {
        iterator: function () { return new Iterator(array); }
    };
}; // Collection
LineItemCtnr.prototype.getGiftCertificateTotalGrossPrice = function () {}; // Money
LineItemCtnr.prototype.getGiftCertificateTotalNetPrice = function () {}; // Money
LineItemCtnr.prototype.getGiftCertificateTotalPrice = function () {}; // Money
LineItemCtnr.prototype.getGiftCertificateTotalTax = function () {}; // Money
LineItemCtnr.prototype.getMerchandizeTotalGrossPrice = function () {}; // Money
LineItemCtnr.prototype.getMerchandizeTotalNetPrice = function () {
    return this.productLineItems.reduce(function (sum, pli) {
        return sum.add(pli.adjustedPrice);
    }, new Money(0, 'USD'));
}; // Money
LineItemCtnr.prototype.getMerchandizeTotalPrice = function () {}; // Money
LineItemCtnr.prototype.getMerchandizeTotalTax = function () {}; // Money
LineItemCtnr.prototype.getNotes = function () {}; // List
LineItemCtnr.prototype.getPaymentInstrument = function () {}; // OrderPaymentInstrument
LineItemCtnr.prototype.getPaymentInstruments = function (paymentMethodID) {
    if (!paymentMethodID) {
        return this.paymentInstruments;
    } return this.paymentInstruments.filter(function (pi) { return pi.ID === paymentMethodID; });
}; // Collection
LineItemCtnr.prototype.getPriceAdjustmentByPromotionID = function (promotionID) {}; // PriceAdjustment
LineItemCtnr.prototype.getPriceAdjustments = function () { return []; }; // Collection
LineItemCtnr.prototype.getProductLineItems = function () { return this.productLineItems; }; // Collection
LineItemCtnr.prototype.getProductQuantities = function () {}; // HashMap
LineItemCtnr.prototype.getProductQuantities = function (includeBonusProducts) {}; // HashMap
LineItemCtnr.prototype.getProductQuantityTotal = function () {}; // Number
LineItemCtnr.prototype.getShipment = function (id) {
    if (!this.shipments) {
        this.shipments = [];
    }
    var shipment = this.shipments.find(function (item) { return item.ID === id; });
    if (!shipment) {
        shipment = new Shipment(id);
        this.shipments.push(shipment);
    }
    return shipment;
}; // Shipment
LineItemCtnr.prototype.getShipments = function () {
    if (!this.shipments) {
        this.shipments = [new Shipment()];
    }
    return this.shipments;
}; // Collection
LineItemCtnr.prototype.getShippingPriceAdjustmentByPromotionID = function (promotionID) {}; // PriceAdjustment
LineItemCtnr.prototype.getShippingPriceAdjustments = function () {}; // Collection
LineItemCtnr.prototype.getShippingTotalGrossPrice = function () {}; // Money
LineItemCtnr.prototype.getShippingTotalNetPrice = function () {}; // Money
LineItemCtnr.prototype.getShippingTotalPrice = function () { return new Money(8, 'USD'); }; // Money
LineItemCtnr.prototype.getShippingTotalTax = function () {}; // Money
LineItemCtnr.prototype.getTotalGrossPrice = function () {
    return this.productLineItems.reduce(function (sum, pli) {
        return sum.add(pli.adjustedPrice);
    }, new Money(0, 'USD'));
}; // Money
LineItemCtnr.prototype.getTotalNetPrice = function () {}; // Money
LineItemCtnr.prototype.getTotalTax = function () { return this.getTotalGrossPrice().multiply(0.05); }; // Money
LineItemCtnr.prototype.removeAllPaymentInstruments = function () {}; // void
LineItemCtnr.prototype.removeBonusDiscountLineItem = function (bonusDiscountLineItem) {}; // void
LineItemCtnr.prototype.removeCouponLineItem = function (couponLineItem) {}; // void
LineItemCtnr.prototype.removeGiftCertificateLineItem = function (giftCertificateLineItem) {}; // void
LineItemCtnr.prototype.removeNote = function (note) {}; // void
LineItemCtnr.prototype.removePaymentInstrument = function (pi) { this.paymentInstruments = this.paymentInstruments.filter(function (item) { return item.ID !== pi.ID; }); }; // void
LineItemCtnr.prototype.removePriceAdjustment = function (priceAdjustment) {}; // void
LineItemCtnr.prototype.removeProductLineItem = function (productLineItem) {}; // void
LineItemCtnr.prototype.removeShipment = function (shipment) {}; // void
LineItemCtnr.prototype.removeShippingPriceAdjustment = function (priceAdjustment) {}; // void
LineItemCtnr.prototype.setCustomerEmail = function (aValue) {}; // void
LineItemCtnr.prototype.setCustomerName = function (aValue) {}; // void
LineItemCtnr.prototype.updateOrderLevelPriceAdjustmentTax = function () {}; // void
LineItemCtnr.prototype.updateTotals = function () {}; // void
LineItemCtnr.prototype.verifyPriceAdjustmentLimits = function () {}; // Status

module.exports = LineItemCtnr;
