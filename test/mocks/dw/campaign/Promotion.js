
var Money = require('../value/Money');

var Promotion = function (testPromotionalPrice) {
    this.testPromotionalPrice = new Money(testPromotionalPrice); // this price will be returned for all products and options for testing purpose
};

Promotion.prototype.getLastModified = function () {};
Promotion.prototype.getName = function () {};
Promotion.prototype.getID = function () {};
Promotion.prototype.getDescription = function () {};
Promotion.prototype.isActive = function () {};
Promotion.prototype.getSourceCodeGroups = function () {};
Promotion.prototype.getCoupons = function () {};
Promotion.prototype.getCustom = function () {};
Promotion.prototype.getStartDate = function () {};
Promotion.prototype.getEndDate = function () {};
Promotion.prototype.isEnabled = function () {};
Promotion.prototype.getCustomerGroups = function () {};
Promotion.prototype.getCampaign = function () {};
Promotion.prototype.getImage = function () {};
Promotion.prototype.getCalloutMsg = function () {};
Promotion.prototype.getDetails = function () {};
Promotion.prototype.isBasedOnCoupons = function () {};
Promotion.prototype.isBasedOnSourceCodes = function () {};
Promotion.prototype.isBasedOnCustomerGroups = function () {};
Promotion.prototype.getExclusivity = function () {};
Promotion.prototype.getRank = function () {};
Promotion.prototype.getPromotionClass = function () {};
Promotion.prototype.getQualifierMatchMode = function () {};
Promotion.prototype.getPromotionalPrice = function () { return this.testPromotionalPrice; };
Promotion.prototype.isBasedOnCoupon = function () {};
Promotion.prototype.getConditionalDescription = function () {};
Promotion.prototype.lastModified = null;
Promotion.prototype.name = null;
Promotion.prototype.ID = null;
Promotion.prototype.description = null;
Promotion.prototype.sourceCodeGroups = null;
Promotion.prototype.coupons = null;
Promotion.prototype.custom = null;
Promotion.prototype.startDate = null;
Promotion.prototype.endDate = null;
Promotion.prototype.customerGroups = null;
Promotion.prototype.campaign = null;
Promotion.prototype.image = null;
Promotion.prototype.calloutMsg = null;
Promotion.prototype.details = null;
Promotion.prototype.exclusivity = null;
Promotion.prototype.rank = null;
Promotion.prototype.promotionClass = null;
Promotion.prototype.qualifierMatchMode = null;
Promotion.prototype.promotionalPrice = null;
Promotion.prototype.conditionalDescription = null;

module.exports = Promotion;
Promotion.EXCLUSIVITY_GLOBAL = 'EXCLUSIVITY_GLOBAL';
Promotion.EXCLUSIVITY_CLASS = 'EXCLUSIVITY_CLASS';
Promotion.EXCLUSIVITY_NONE = 'EXCLUSIVITY_NONE';
