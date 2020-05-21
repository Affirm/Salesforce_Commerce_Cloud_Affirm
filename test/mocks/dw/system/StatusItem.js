/**
 * Represents dw.system.StatusItem
 */
var StatusItem = function (code, msg) {
    this.code = code;
    this.message = msg;
};

StatusItem.prototype.details = null; // Map
StatusItem.prototype.error = null; // boolean
StatusItem.prototype.parameters = null; // List
StatusItem.prototype.status = null; // Number

StatusItem.prototype.addDetail = function (key, value) {}; // void
StatusItem.prototype.getCode = function () {}; // String
StatusItem.prototype.getDetails = function () {}; // Map
StatusItem.prototype.getMessage = function () {}; // String
StatusItem.prototype.getParameters = function () {}; // List
StatusItem.prototype.getStatus = function () {}; // Number
StatusItem.prototype.isError = function () {}; // boolean
StatusItem.prototype.setCode = function (code) {}; // void
StatusItem.prototype.setMessage = function (message) {}; // void
StatusItem.prototype.setParameters = function (parameters) {}; // void
StatusItem.prototype.setStatus = function (status) {}; // void

module.exports = StatusItem;
