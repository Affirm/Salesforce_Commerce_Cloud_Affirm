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
 * Returns round value of a number in order details page
 * @param {number} value - number
 * @returns {number} round number
 */
Utils.round = function (value) {
	var num = Math.round(value * 100) / 100
	if (Math.abs(num) < 0.0001) {
		return 0.0
	} else {
		return num
	}
}

/**
 * Returns round value of a number in order details page
 * @param {number} value - number
 * @returns {number} round number
 */
Utils.toCents = function (value) {
	var num = parseInt(Math.round(value * 100))
	return num
}

module.exports = Utils
