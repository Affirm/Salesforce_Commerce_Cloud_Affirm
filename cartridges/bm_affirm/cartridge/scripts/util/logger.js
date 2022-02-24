/*
 *	Creates custom log file for the cartridge
 */

// API Includes
var Logger = require("dw/system/Logger")
var Resource = require("dw/web/Resource")

// Global Variables
var defaultLogFilePrefix = "AffirmLogger"
var LoggerUtils = {}

LoggerUtils.getLogger = function (category) {
	if (category) {
		return Logger.getLogger(defaultLogFilePrefix, category)
	} else {
		return Logger.getLogger(defaultLogFilePrefix)
	}
}

/**
 *	Mask customer PII
 * @param {Object} data - request object
 * @returns {Object} masked data
 */
LoggerUtils.maskCustomerData = function (data) {
	var maskedData = JSON.stringify(data)
	maskedData = LoggerUtils.actionMaskData(JSON.parse(maskedData))

	return JSON.stringify(maskedData)
}

/**
 *	Mask customer PII action
 * @param {Object} obj - request object
 * @returns {Object} masked data
 */
LoggerUtils.actionMaskData = function (obj) {
	for (var key in obj) {
		switch (key) {
			case "first_name":
			case "last_name":
			case "expiration":
			case "billing_address":
			case "shipping_address":
			case "phones":
			case "emails":
				obj[key] = "***"
		}

		if (typeof obj[key] === "object") {
			LoggerUtils.actionMaskData(obj[key])
		}
	}

	return obj
}

module.exports = LoggerUtils
