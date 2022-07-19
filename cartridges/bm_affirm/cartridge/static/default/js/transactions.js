"use strict"

var tnxs = {
	init: function () {
		if (document.querySelectorAll(".affirm-module .operations-holder").length) {
			this.tnxsOperationsEvents()
		}
	},
	tnxsOperationsEvents: function () {
		var inputs = document.querySelectorAll(".operations-holder input[type=number]")
		inputs.forEach((input) => {
			input.addEventListener("focus", function () {
				this.closest("tr").querySelector("input[type=radio]").checked = true
			})

			// Santize amount input
			input.addEventListener("blur", function () {
				var input = this

				if (input.value != "") {
					input.value = parseFloat(input.value, 10).toFixed(2)
				} else if ( input.value == "") {
					input.value = 0
				}
			})
		})

		document
			.querySelector(".operations-holder button")
			.addEventListener("click", async function () {
				var btn = this
				var checkedInput = document.querySelector("input[name=operation]:checked")
				var action = checkedInput ? checkedInput.value : null
				var orderRefId = document.querySelector("input[name=orderRefId]").value
				var maxCaptureAmt = document.querySelector("input[name=maxcaptureamount]").value
				var maxRefundAmt = document.querySelector("input[name=maxrefundamount]").value
				var url
				var reqData
				var amount

				var errorMsg = document.querySelector(".operations-holder .error")
				var refundAmt = document.querySelector("input[name=refundamount]").value
				var captureAmt = document.querySelector("input[name=captureamount]").value
				var currency = document.querySelector("input[name=currencyCode]").value

				// Format amount
				switch (action) {
					case "capture":
						amount = parseFloat(captureAmt)
						break;
					case "refund":
						amount = parseFloat(refundAmt)
						break;
					default:
						amount = 0
				}

				if (!action) {
					errorMsg.textContent = Resources.CHOOSE_ACTIONS
					return false
				}

				// Confirm prompt
				var confirmPrompt = (action == "refund" || action == "capture")
					? 'Please confirm the ' + action + ' amount: ' + amount + ' ' + currency
					: 'Please confirm the action for this order: ' + action
				var confirm = window.confirm(confirmPrompt)
				if (!confirm) {
					return false
				}

				if (action == "refund") {
					if (!refundAmt || amount <= 0.0) {
						errorMsg.textContent = Resources.INVALID_REFUND_AMOUNT
						return false
					} else if (amount > maxRefundAmt) {
						errorMsg.textContent = Resources.MAXIMUM_REFUND_AMOUNT + " " + maxRefundAmt
						return false
					}
				}

				if (action == "capture") {
					if (!captureAmt || amount <= 0.0) {
						errorMsg.textContent = Resources.INVALID_CAPTURE_AMOUNT
						return false
					} else if (amount > maxCaptureAmt) {
						errorMsg.textContent = Resources.MAXIMUM_CAPTURE_AMOUNT + " " + maxCaptureAmt
						return false
					} else if ( currency != 'USD' && amount != maxCaptureAmt) {
						errorMsg.textContent = Resources.INVALID_CAPTURE_AMOUNT_PARTIAL
						return false
					}
				}

				errorMsg.textContent = ""
				url = Urls.operationActions
				reqData = { action: action, orderRefId: orderRefId, amount: amount }

				btn.disabled = true
				btn.textContent = Resources.TRANSACTION_PROCESSING

				var _xhr = new XMLHttpRequest()
				_xhr.open("POST", url, true)
				_xhr.setRequestHeader("Content-Type", "application/json")
				_xhr.onreadystatechange = function() {
					if (_xhr.readyState === XMLHttpRequest.DONE) {
						var status = _xhr.status;
						var res = JSON.parse(_xhr.response)
						if (status >= 200 && status < 300 && res && res.status) {
							alert(Resources.TRANSACTION_SUCCESS)
							window.location.reload()
						} else {
							alert(Resources.TRANSACTION_FAILED + res.error)
							window.location.reload()
						}
					}
				}
				_xhr.send(JSON.stringify(reqData))
			})

	},
}

//initialize app
window.onload = function() {
	tnxs.init()
}