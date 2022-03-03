"use strict"

/* Custom Logger */
var LogUtils = require("*/cartridge/scripts/util/logger")
var log = LogUtils.getLogger("Affirm-Operations")

/**
 * Controller for backoffice transaction
 *
 */

/**
 * redirects to specific actions
 * */
function performAction() {
	var requestBody = request.getHttpParameterMap().getRequestBodyAsString()
	var params = JSON.parse(requestBody)
	var action = params.action
	var orderRefId = params.orderRefId
	var utils = require("~/cartridge/scripts/util/affirmUtils")
	var amount = params.amount
		? utils.toCents(params.amount)
		: null
	var handleTransaction = require("~/cartridge/scripts/handleTransaction")

	switch (action) {
		case "read":
			result = handleTransaction.read(orderRefId)
			break
		case "capture":
			result = handleTransaction.capture(orderRefId, amount)
			break
		case "refund":
			result = handleTransaction.refund(orderRefId, amount)
			break
		case "cancel":
			result = handleTransaction.cancel(orderRefId)
			break
	}

	var r = require("~/cartridge/scripts/util/response")
	r.renderJSON(result)
}

/*
 * Exposed web methods
 */
performAction.public = true

exports.Action = performAction
