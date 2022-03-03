"use strict"

/**
 * Controller for BM Transaction Management pages
 *
 */

/* API Includes */
var OrderMgr = require("dw/order/OrderMgr")
var ISML = require("dw/template/ISML")

/* Custom Logger */
var LogUtils = require("*/cartridge/scripts/util/logger")
var log = LogUtils.getLogger("Affirm-HandleTransaction")

/**
 Affirm Order List page
 */
function orderList() {
	var pageSize = request.httpParameterMap.pagesize.value
	var pageNumber = request.httpParameterMap.pagenumber.value
	var orderRefId = request.httpParameterMap.orderRefId.value || ""
	var orderListResponse

	pageSize = pageSize ? parseInt(pageSize, 10) : 10
	pageNumber = pageNumber ? parseInt(pageNumber, 10) : 1

	orderListResponse = require("~/cartridge/scripts/getOrders").output({
		pageSize: pageSize,
		pageNumber: pageNumber,
		orderRefId: orderRefId,
	})

	ISML.renderTemplate("application/orderlist", orderListResponse)
}

/**
 * Affirm Order Details page
 **/
function orderDetails() {
	var resourceHelper = require("~/cartridge/scripts/util/resource")
	var utils = require("~/cartridge/scripts/util/affirmUtils")
	var orderRefId = request.httpParameterMap.orderRefId.stringValue
	var order = OrderMgr.searchOrder("custom.AffirmExternalId = {0}", orderRefId)
	var shipment = order.getDefaultShipment()
	var handleTransaction = require("~/cartridge/scripts/handleTransaction")
	try {
		handleTransaction.read(orderRefId)
	} catch (error) {
		log.error("Exception occured while fetching transaction history: " + error)
	}
	var amountAuth = utils.toDollars(order.custom.AffirmAuthAmount)
	var amountCaptured = utils.toDollars(order.custom.AffirmCapturedAmount)
	var amountRefunded = utils.toDollars(order.custom.AffirmRefundedAmount)
	var amountDue = amountAuth - amountCaptured
	var authBalance = amountCaptured - amountRefunded
	var transactionHistory = order.custom.AffirmTransactionHistory || "[]"
	ISML.renderTemplate("application/orderdetails", {
		resourceHelper: resourceHelper,
		order: order,
		shippingAddress: shipment.shippingAddress,
		transactionHistory: transactionHistory,
		amountDue: amountDue,
		amountAuth: amountAuth,
		amountCaptured: amountCaptured,
		amountRefunded: amountRefunded,
		authBalance: authBalance,
	})
}

/**
 * Affirm docs
 * */
function documentation() {
	ISML.renderTemplate("application/documentation")
}
/**
 * Exposed web methods
 */
orderList.public = true
orderDetails.public = true
documentation.public = true

exports.OrderList = orderList
exports.OrderDetails = orderDetails
exports.Documentation = documentation
