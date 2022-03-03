"use strict"

// API Includes
var OrderMgr = require("dw/order/OrderMgr")
var ArrayList = require("dw/util/ArrayList")

/**
 * Get order list for custom order list page
 * @param {Object} input input object
 * @returns {Object} order details
 **/
function getOrders(input) {
	var pageSize = input.pageSize
	var pageNumber = input.pageNumber
	var orderRefId = input.orderRefId
	var result = new ArrayList()
	var totalOrderCount
	var startRow
	var endRow
	var orders
	var order
	var rowCount
	var pageCount

	totalOrderCount = startRow = endRow = rowCount = pageCount = 0

	if (orderRefId) {
		// searching for an order ID
		order = OrderMgr.searchOrder("custom.AffirmExternalId = {0}", orderRefId)

		if (order) {
			result.push(order)
			totalOrderCount = startRow = endRow = 1
		}
	} else {
		// all orders on pagination
		orders = OrderMgr.searchOrders(
			"custom.AffirmExternalId != NULL",
			"creationDate desc"
		)

		orders.forward((pageNumber - 1) * pageSize, pageSize)

		while (orders.hasNext()) {
			result.push(orders.next())
			rowCount++
		}

		totalOrderCount = orders.count
		startRow = (pageNumber - 1) * pageSize + 1
		endRow = startRow + rowCount - 1
		pageCount = Math.ceil(totalOrderCount / pageSize)
	}

	return {
		orders: result,
		totalOrderCount: totalOrderCount,
		startRow: startRow,
		endRow: endRow,
		pageSize: pageSize,
		pageNumber: pageNumber,
		pageCount: pageCount,
		orderRefId: orderRefId,
	}
}

module.exports = {
	output: function (input) {
		return getOrders(input)
	},
}
