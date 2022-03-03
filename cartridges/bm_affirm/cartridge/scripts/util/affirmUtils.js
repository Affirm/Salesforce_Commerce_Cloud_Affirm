/**
 * Utility functions for the BM cartridge
 */

/* API Includes */
var Site = require("dw/system/Site")
var System = require("dw/system/System")
var Transaction = require("dw/system/Transaction")

/* Custom Logger */
var LogUtils = require("*/cartridge/scripts/util/logger")
var log = LogUtils.getLogger("Affirm-HandleTransaction")

var Utils = {}

/**
 * Returns an integer number in cents for payload and storage
 * @param {number} value - number
 * @returns {number} number in cents
 */
Utils.toCents = function (value) {
    var num = parseInt(Math.round(value * 100))
    return num
}

/**
 * Returns a decimal number after cents to dollar conversion
 * @param {number} value - number
 * @returns {number} number in dollars
 */
Utils.toDollars = function (value) {
    var num = Math.round(value * 100) / 100
    if (Math.abs(num) < 0.0001) {
        return 0.0
    } else {
        return num / 100
    }
}

module.exports = Utils
