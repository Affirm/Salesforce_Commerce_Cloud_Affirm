
var OrderAddress = function () {};

OrderAddress.prototype.getSuite = function () {};
OrderAddress.prototype.getAddress1 = function () {};
OrderAddress.prototype.getAddress2 = function () {};
OrderAddress.prototype.getCity = function () {};
OrderAddress.prototype.getStateCode = function () {};
OrderAddress.prototype.getPostalCode = function () {};
OrderAddress.prototype.getCountryCode = function () { return { getValue: function () {} }; };
OrderAddress.prototype.getPhone = function () {};
OrderAddress.prototype.getTitle = function () {};
OrderAddress.prototype.setCity = function (strValue) { this.city = strValue; };
OrderAddress.prototype.getCompanyName = function () {};
OrderAddress.prototype.setCompanyName = function () {};
OrderAddress.prototype.setCountryCode = function (strValue) { this.countryCode = strValue; };
OrderAddress.prototype.getFirstName = function () {};
OrderAddress.prototype.setFirstName = function (strValue) { this.firstName = strValue; };
OrderAddress.prototype.getFullName = function () {};
OrderAddress.prototype.getJobTitle = function () {};
OrderAddress.prototype.setJobTitle = function () {};
OrderAddress.prototype.getLastName = function () {};
OrderAddress.prototype.setLastName = function (strValue) { this.lastName = strValue; };
OrderAddress.prototype.setPhone = function (strValue) { this.phone = strValue; };
OrderAddress.prototype.setPostalCode = function (strValue) { this.postalCode = strValue; };
OrderAddress.prototype.getPostBox = function () {};
OrderAddress.prototype.setPostBox = function () {};
OrderAddress.prototype.getSecondName = function () {};
OrderAddress.prototype.setSecondName = function () {};
OrderAddress.prototype.setStateCode = function (strValue) { this.stateCode = strValue; };
OrderAddress.prototype.setAddress1 = function (strValue) { this.address1 = strValue; };
OrderAddress.prototype.setAddress2 = function (strValue) { this.address2 = strValue; };
OrderAddress.prototype.getSuffix = function () {};
OrderAddress.prototype.setSuffix = function () {};
OrderAddress.prototype.setTitle = function () {};
OrderAddress.prototype.getSalutation = function () {};
OrderAddress.prototype.setSaluation = function () {};
OrderAddress.prototype.setSalutation = function () {};
OrderAddress.prototype.setSuite = function () {};
OrderAddress.prototype.isEquivalentAddress = function () {};
OrderAddress.prototype.suite = null;
OrderAddress.prototype.address1 = null;
OrderAddress.prototype.address2 = null;
OrderAddress.prototype.city = null;
OrderAddress.prototype.stateCode = null;
OrderAddress.prototype.postalCode = null;
OrderAddress.prototype.countryCode = null;
OrderAddress.prototype.phone = null;
OrderAddress.prototype.title = null;
OrderAddress.prototype.companyName = null;
OrderAddress.prototype.firstName = null;
OrderAddress.prototype.fullName = null;
OrderAddress.prototype.jobTitle = null;
OrderAddress.prototype.lastName = null;
OrderAddress.prototype.postBox = null;
OrderAddress.prototype.secondName = null;
OrderAddress.prototype.suffix = null;
OrderAddress.prototype.salutation = null;

module.exports = OrderAddress;
