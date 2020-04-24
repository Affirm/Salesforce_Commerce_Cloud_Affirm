(function () {
    /**
     * Creates library for working with Order
     * Middleware layer between Affirm API and SFCC orders
     *
     * @constructor
     * @this {Order}
     */
    var affirmOrder = function () {
        var logger = require('dw/system').Logger.getLogger('Affirm', '');
        var OrderMgr = require('dw/order/OrderMgr');
        var Order = require('dw/order/Order');
        var Money = require('dw/value/Money');
        var File = require('dw/io/File');
        var FileReader = require('dw/io/FileReader');
        var FileWriter = require('dw/io/FileWriter');
        var data = require('*/cartridge/scripts/data/affirmData');
        var basket = require('*/cartridge/scripts/basket/affirmBasket');
        var api = require('*/cartridge/scripts/api/affirmAPI');
        var filepath = File.IMPEX + File.SEPARATOR + 'affirm' + File.SEPARATOR;
        var filename = 'affirm.dat';

        /**
         * @returns {Date} date
         */
        function readDateFromFile() {
            var file = new File(filepath + filename);
            if (file.exists()) {
                var fileReader = new FileReader(file);
                var strDate = fileReader.readLine();
                fileReader.close();
                if (strDate) {
                    return new Date(Date.parse(strDate));
                }
            }
            return new Date(0);
        }

        /**
         * @param {Date} date date
         */
        function saveDateToFile(date) {
            var dir = new File(filepath);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            var file = new File(filepath + filename);
            if (!file.exists()) {
                file.createNewFile();
            }
            var fileWriter = new FileWriter(file);
            fileWriter.writeLine(date.toISOString());
            fileWriter.flush();
            fileWriter.close();
        }
        /**
         * Updates PaymentInstrument and Order system objects
         *
         * @param {dw.order.Order} order demnadware order instance
         * @param {Object} reponse auth response from Affirm
         * @param {dw.order.PaymentProcessor} paymentProcessor payment processor instance
         * @param {dw.order.PaymentInstrument} paymentInstrument payment isntrument instance
         */
        this.updateAttributes = function (order, reponse, paymentProcessor, paymentInstrument) {
            try {
                paymentInstrument.paymentTransaction.transactionID = reponse.events[0].id;
                paymentInstrument.paymentTransaction.amount = new Money(reponse.amount, order.currencyCode).divide(100);
                paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
                order.custom.AffirmToken = reponse.events[0].id;
                order.custom.AffirmExternalId = reponse.id;
                order.custom.AffirmStatus = 'AUTH';
                order.custom.AffirmPaymentAction = data.getAffirmPaymentAction();
            } catch (e) {
                logger.error('Affirm. File - affirmOrder. Error - {0}', e);
            }
        };

        this.orderCanceledVoid = function (order) {
	    if (order.custom.AffirmExternalId) {
        	api.void(order.custom.AffirmExternalId);
        	order.custom.AffirmStatus = 'VOIDED';
            }

	    return order;
        };

        this.authOrder = api.auth;
        this.voidOrder = api.void;

        this.captureOrder = api.capture;
        /**
         * Capture new orders and update their afirm status. Used in Affirm job.
         *
         * @see pipeline 'AffirmJob'
         */
        this.captureOrders = function () {
            OrderMgr.processOrders(function (order) {
                try {
                    api.capture(order.custom.AffirmExternalId, order.orderNo);
                    order.custom.AffirmStatus = 'CAPTURE';
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    order.setStatus(Order.ORDER_STATUS_COMPLETED);
                } catch (e) {
                    logger.error('Affirm. File - affirmOrder. Error - {0}', e);
                }
            }, '(status = {0} OR status = {1}) AND custom.AffirmPaymentAction = {2} AND custom.AffirmStatus = {3}', Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN, 'AUTH', 'AUTH');
        };
        /**
         * Void cancelled orders and update their afirm status. Used in Affirm job.
         *
         * @see pipeline 'AffirmJob'
         */
        this.voidOrders = function () {
            OrderMgr.processOrders(function (order) {
                try {
                    api.void(order.custom.AffirmExternalId);
                    order.custom.AffirmStatus = 'VOIDED';
                } catch (e) {
                    logger.error('Affirm. File - affirmOrder. Error - {0}', e);
                }
            }, 'status = {0} AND custom.AffirmStatus = {1}', Order.ORDER_STATUS_CANCELLED, 'AUTH');
        };

        /**
         * Refund captured orders and update their afirm status. Used in Affirm job.
         *
         * @see pipeline 'AffirmJob'
         */
        this.refundOrders = function () {
            OrderMgr.processOrders(function (order) {
                try {
                    api.refund(order.custom.AffirmExternalId);
                    order.custom.AffirmStatus = 'REFUNDED';
                } catch (e) {
                    logger.error('Affirm. File - affirmOrder. Error - {0}', e);
                }
            }, 'status = {0} AND custom.AffirmStatus = {1}', Order.ORDER_STATUS_CANCELLED, 'CAPTURE');
        };
        /**
         * Update orders on Affirm side. Used in Affirm job.
         *
         * @see pipeline 'AffirmJob'
         */
        this.updateOrders = function () {
            var lastUpdateDateTime = readDateFromFile();
            var startDate = new Date();
            OrderMgr.processOrders(function (order) {
                try {
                    var orderShipment = order.getDefaultShipment();
                    var shippingAddress = orderShipment.shippingAddress;
                    var updateObject = {
                        order_id: order.orderNo,
                        shipping: basket.getShippingAddress(order)
                    };
                    if (orderShipment.shippingMethod && orderShipment.shippingMethod.displayName) {
                        updateObject.shipping_carrier = orderShipment.shippingMethod.displayName;
                    }
                    if (orderShipment.trackingNumber) {
                        updateObject.shipping_confirmation = orderShipment.trackingNumber;
                    }
                    api.update(order.custom.AffirmExternalId, updateObject);
                } catch (e) {
                    logger.error('Affirm. File - affirmOrder. Error - {0}', e);
                }
            }, 'custom.AffirmStatus != NULL AND lastModified > {0}', lastUpdateDateTime.toISOString());
            saveDateToFile(startDate);
        };

        /**
		 * Prepare order information for orderconfirmation page.
		 * @param {dw.order.Order} order SFCC order
         * @returns {Object} oder and product information
		 */
        this.trackOrderConfirmed = function (order) {
            var orderInfo;

            order = OrderMgr.getOrder(order);
            if (order) {
                orderInfo = {
                    storeName: dw.system.Site.getCurrent().name,
                    coupon: getCouponList(order),
                    currency: order.getCurrencyCode(),
                    discount: getOrderDiscount(order),
				    paymentMethod: order.getPaymentInstruments()[0].paymentMethod,
                    revenue: priceToInteger(order.getMerchandizeTotalNetPrice()),
                    shipping: priceToInteger(order.getShippingTotalPrice()),
                    shippingMethod: (order.getShipments().length === 1 && order.getShipments()[0].shippingMethod) ? order.getShipments()[0].shippingMethod.displayName : 'other',
                    tax: priceToInteger(order.getTotalTax()),
                    orderId: order.orderNo,
                    total: priceToInteger(order.getTotalGrossPrice())
                };
            }

		    var productArray = [];
            var products = order.getAllProductLineItems().iterator();
            while (products.hasNext()) {
                var lineItem = products.next();
                if (!lineItem.bundledProductLineItem) {
                    var obj = {
                        name: lineItem.product ? lineItem.product.name : lineItem.productName,
                        price: priceToInteger(lineItem.adjustedPrice),
                        productId: lineItem.product ? lineItem.product.ID : lineItem.optionID,
                        quantity: lineItem.quantity.value
                    };

                    if (lineItem.product) {
                        if (lineItem.product.brand) {
							 	obj.brand = lineItem.product.brand;
							 }

                        if (lineItem.product.primaryCategory) {
							 	obj.category = lineItem.product.primaryCategory.ID;
							  } else if (lineItem.product.classificationCategory){
							  		obj.category = lineItem.product.classificationCategory.ID
							  	}
                    }

                    productArray.push(obj);
                }
            }
            return { orderInfo: orderInfo, productInfo: productArray };
        };
    };
    module.exports = new affirmOrder();
}());


/**
 * function that converts price to integer (cents) using java methods
 * @param {dw.value.Money} price Money
 * @returns {number} Number
 */
function priceToInteger(price) {
    var dec = price.getDecimalValue();
    dec = dec.multiply(100);
    dec = dec.get();
    return dec;
}

/**
 * function that returns order discount in cents
 * @param {dw.order.Order} order Order
 * @returns {number} Number
 */
function getOrderDiscount(order) {
    var discount = 0;
	 order.getPriceAdjustments().toArray().map(function (elem) {
        discount += priceToInteger(elem.price);
    });

    return -discount;
}

/**
 * function that returns coupons applied to order
 * @param {dw.order.Order} order Order
 * @returns {string} String
 */
function getCouponList(order) {
    var coupons = order.getCouponLineItems().toArray().map(function (elem) {
        return elem.couponCode;
    });
    return coupons.join(',');
}
