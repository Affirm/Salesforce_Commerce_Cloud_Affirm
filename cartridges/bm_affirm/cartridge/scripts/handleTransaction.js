"use strict"

/**
 * Affirm Transaction Handler
 */

/* API Includes */
var OrderMgr = require("dw/order/OrderMgr")
var Transaction = require("dw/system/Transaction")
var Resource = require("dw/web/Resource")

/* Script Modules */
var Utils = require("*/cartridge/scripts/util/affirmUtils")

/* Custom Logger */
var LogUtils = require("*/cartridge/scripts/util/logger")
var log = LogUtils.getLogger("Affirm-HandleTransaction")

/* Affirm API */
var api = require("*/cartridge/scripts/api/affirmAPI")

/**
 * Read Transactions history from Affirm API and update the order custom attribute
 * @param {string} transactionID - Affrim Transaction ID
 */
function read(transactionID) {
	var Order = OrderMgr.searchOrder(
		"custom.AffirmExternalId = {0}",
		transactionID
	)

	try {
		var _r = api.read(transactionID)
		var events = []
		if (typeof _r.response !== 'undefined' && typeof _r.response.events !== 'undefined') {
			// Truncate if the count of records is larger than 25
			events = _r.response.events.length > 25
				? [{'id': '(Truncated)'}].concat(_r.response.events.slice(-25))
				: _r.response.events
		}
		var responseStatus = _r.response.status
		var customStatus = ''

		// Update custom AffirmStatus value based on response
		switch (responseStatus) {
			case 'authorized':
				customStatus = 'AUTH'
				break
			case 'voided':
				customStatus = 'VOIDED'
				break
			case 'partially_captured':
			case 'partially_refunded':
				customStatus = 'PARTIALLY_CAPTURED'
				break
			case 'captured':
				customStatus = 'CAPTURE'
				break
			case 'refunded':
				customStatus = 'REFUNDED'
				break
			default:
				log.error("Invalid Affirm Status returned")
				return {
					status: false,
					error: true,
				}
		}

		Transaction.wrap(function () {
			if (Order.custom.AffirmStatus.value !== customStatus) {
				Order.custom.AffirmStatus = customStatus
			}
			Order.custom.AffirmTransactionHistory = JSON.stringify(events)
		})
		return {
			status: true,
			error: false,
		}
	} catch (e) {
		log.error("Exception occurred: " + e)
		return {
			status: false,
			error: true,
		}
	}
}

/**
 * Cancel (Void) action
 * @param {string} transactionID - Affirm Transaction ID
 * @returns {Object} response
 */
function cancel(transactionID) {
	var Order = OrderMgr.searchOrder(
		"custom.AffirmExternalId = {0}",
		transactionID
	)
	var authAmount = parseFloat(Order.custom.AffirmAuthAmount)

	if (Order.custom.AffirmStatus.value !== "AUTH") {
		log.error("Invalid void action")
		return {
			status: false,
			error: true,
		}
	}

	try {
		var _r = api.void(transactionID)
		Transaction.wrap(function () {
			Order.custom.AffirmStatus = "VOIDED"
			Order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID)
			Order.setStatus(Order.ORDER_STATUS_CANCELLED)
		})
		return {
			status: true,
			error: false,
		}
	} catch (e) {
		log.error("Exception occurred: " + e)
		return {
			status: false,
			error: true,
		}
	}
}

/**
 * Capture action
 * @param {string} transactionID - transaction id
 * @param {string} amount - capture amount
 * @returns {Object} transaction details
 */
function capture(transactionID, amount) {
	var Order = OrderMgr.searchOrder(
		"custom.AffirmExternalId = {0}",
		transactionID
	)
	var status = false
	var error
	var amountToCapture = parseFloat(amount)
	var authAmount = parseFloat(Order.custom.AffirmAuthAmount)
	var capturedAmount = parseFloat(Order.custom.AffirmCapturedAmount)

	switch (Order.custom.AffirmStatus.value) {
		case "AUTH":
		case "PARTIALLY_CAPTURED":
			break
		default:
			log.error("Invalid capture action")
			return {
				status: false,
				error: true,
			}
	}

	if (
		typeof amountToCapture == "undefined" ||
		(typeof amountToCapture !== "undefined" && amountToCapture <= 0)
	) {
		log.error("Invalid capture amount")
		return {
			status: false,
			error: true,
		}
	}

	try {
		var _r = api.capture(transactionID, Order.orderNo, amountToCapture)
		var newCapturedAmount = capturedAmount + parseFloat(_r.response.amount)
		Transaction.wrap(function () {
			Order.custom.AffirmCapturedAmount = newCapturedAmount
			if (authAmount === newCapturedAmount) {
				Order.custom.AffirmStatus = "CAPTURE"
				Order.setPaymentStatus(Order.PAYMENT_STATUS_PAID)
				Order.setStatus(Order.ORDER_STATUS_COMPLETED)
			} else {
				Order.custom.AffirmStatus = "PARTIALLY_CAPTURED"
				Order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID)
			}
		})
		return {
			status: true,
			error: false,
		}
	} catch (e) {
		log.error("Exception occurred: " + e)
		return {
			status: false,
			error: true,
		}
	}
}

/**
 * Refund action
 * @param {string} transactionID - transaction id
 * @param {string} amount - refund amount
 * @returns {Object} transaction details
 */
function refund(transactionID, amount) {
	var Order = OrderMgr.searchOrder(
		"custom.AffirmExternalId = {0}",
		transactionID
	)
	var status = false
	var error
	var amountToRefund = parseFloat(amount)
	var authAmount = parseFloat(Order.custom.AffirmAuthAmount)
	var capturedAmount = parseFloat(Order.custom.AffirmCapturedAmount)
	var refundedAmount = parseFloat(Order.custom.AffirmRefundedAmount)

	switch (Order.custom.AffirmStatus.value) {
		case "CAPTURE":
		case "PARTIALLY_CAPTURED":
			break
		default:
			log.error("Invalid capture action")
			return {
				status: false,
				error: true,
			}
	}

	if (
		typeof amountToRefund == "undefined" ||
		(typeof amountToRefund !== "undefined" && amountToRefund <= 0) ||
		amountToRefund + refundedAmount > capturedAmount
	) {
		log.error("Invalid refund amount")
		return {
			status: false,
			error: true,
		}
	}

	try {
		var _r = api.refund(transactionID, amountToRefund)
		var newRefundedAmount =
			refundedAmount + parseFloat(_r.response.amount)
		Transaction.wrap(function () {
			Order.custom.AffirmRefundedAmount = newRefundedAmount
			if (authAmount === newRefundedAmount) {
				Order.custom.AffirmStatus = "REFUNDED"
				Order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID)
				Order.setStatus(Order.ORDER_STATUS_CANCELLED)
			}
		})
		return {
			status: true,
			error: false,
		}
	} catch (e) {
		log.error("Exception occurred: " + e)
		return {
			status: false,
			error: true,
		}
	}
}

exports.capture = function (orderNo, amount) {
	return capture(orderNo, amount)
}
exports.refund = function (orderNo, amount) {
	return refund(orderNo, amount)
}
exports.cancel = function (orderNo) {
	return cancel(orderNo)
}
exports.read = function (orderNo) {
	return read(orderNo)
}
