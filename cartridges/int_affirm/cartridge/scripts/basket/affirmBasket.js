(function () {
    /**
	 * Creates library for working with Basket
	 *
	 * @constructor
	 * @this {Basket}
	 */
    var Basket = function () {
        var self = this,
            web = require('dw/web'),
            system = require('dw/system'),
            PaymentMgr = require('dw/order/PaymentMgr'),
            BasketMgr = require('dw/order/BasketMgr'),
            ProductMgr = require('dw/catalog/ProductMgr'),
            HookMgr = require('dw/system/HookMgr'),
            Transaction = require('dw/system/Transaction'),
            affirmUtils = require('*/cartridge/scripts/utils/affirmUtils'),
            affirmData = require('*/cartridge/scripts/data/affirmData'),
            Status = require('dw/system/Status');

        self.utils = affirmUtils;

        /**
		 * Build shipping address object based on Basket
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {Object} simple object with name and shipping address
		 */
        self.getShippingAddress = function (basket) {
            var shippingAddress = basket.getDefaultShipment().getShippingAddress();
            var shippingContact = {};
            if (shippingAddress){
                shippingContact = {
                    'name' : {
                        'first' : shippingAddress.getFirstName(),
                        'last' : shippingAddress.getLastName(),
                        'full' : shippingAddress.getFullName()
                    },
                    'address' : {
                        'street1' : shippingAddress.getAddress1(),
                        'street2' : shippingAddress.getAddress2(),
                        'city' : shippingAddress.getCity(),
                        'region1_code' : shippingAddress.getStateCode(),
                        'postal_code' : shippingAddress.getPostalCode(),
                        'country' : shippingAddress.getCountryCode().getValue()
                    }
                };
            }

            return shippingContact;
        };

        /**
		 * Build billing address object based on Basket
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {Object} simple object with name and billing address
		 */
        self.getBillingAddress = function (basket) {
            var billingAddress = basket.getBillingAddress();
            if (empty(billingAddress)){
                return null;
            }
            var billingConact = {
                'name' : {
                    'first' : billingAddress.getFirstName(),
                    'last' : billingAddress.getLastName(),
                    'full' : billingAddress.getFullName()
                },
                'address' : {
                    'street1' : billingAddress.getAddress1(),
                    'street2' : billingAddress.getAddress2(),
                    'city' : billingAddress.getCity(),
                    'region1_code' : billingAddress.getStateCode(),
                    'postal_code' : billingAddress.getPostalCode(),
                    'country' : billingAddress.getCountryCode().getValue()
                },
                'phone_number' : billingAddress.getPhone(),
                'email' : basket.getCustomerEmail()
            };

            return billingConact;
        };

        /**
		 * Build items object based on Basket
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {Object} simple object contained product data
		 */
        self.getItems = function (basket) {
            var items = [],
                image = '',
                productLineItems = basket.getProductLineItems().iterator();

            while (!empty(productLineItems) && productLineItems.hasNext()) {
                var productLineItem = productLineItems.next();
                var product = ProductMgr.getProduct(productLineItem.productID);
                var categoriesCollection = product.getAllCategoryAssignments().iterator();
			 	var categoryNames = [];

			 	if(!categoriesCollection.hasNext()) {
			 		product = product.getVariationModel().getMaster();
			 		categoriesCollection = product.getAllCategoryAssignments().iterator();
			 	}


			 	while(categoriesCollection.hasNext()){
			 		var category = 	categoriesCollection.next();
			 		var arr = [];

                    /**
                      *
                      * @param {Object} obj category to be checked
                      */
                    function checkForParentCategory(obj) {
                        if (('parent' in obj) && obj.parent != null) {
                            arr.push(obj.displayName);
                            checkForParentCategory(obj.parent)
                        }
                    }
			 		checkForParentCategory(category.category);
			 		categoryNames.push(arr.reverse());
			 	}

			 	if (!empty(productLineItem.product)){
			 		if (!!(productLineItem.product.getImage('medium'))){
			 			image = productLineItem.product.getImage('medium').getHttpURL().toString();
			 		}
			 	}

                items.push({
                    'display_name' : productLineItem.getProductName(),
                    'sku' : productLineItem.getProductID(),
                    'unit_price' : productLineItem.optionProductLineItem ?
                        productLineItem.getBasePrice().multiply(100).getValue() :
                        productLineItem.product.getPriceModel().getPrice().multiply(100).getValue(),
                    'qty' : productLineItem.getQuantityValue(),
                    'item_image_url' : image,
                    'item_url' : !empty(productLineItem.product) ?
                        web.URLUtils.abs('Product-Show', 'pid', productLineItem.product.getID()).toString() :
                        '',
                    'categories': categoryNames
                });
            }
            return items;
        };

        /**
		 * Checks possibility of using Affirm payment method
		 * Removes one if it cann't be accepted
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @param {dw.util.Collection} ApplicablePaymentMethods SFCC basket
		 * @returns {Object} simple object contained product data
		 */
        self.validatePayments = function (basket, ApplicablePaymentMethods) {
            if (!basket.getGiftCertificateLineItems().empty || !affirmData.getAffirmOnlineStatus() || !affirmUtils.checkBasketTotalRange('object' in basket ? basket.object : basket)) {
                let affirmPaymentMethod = PaymentMgr.getPaymentMethod('Affirm');

                ApplicablePaymentMethods.remove(affirmPaymentMethod);
            }

            return ApplicablePaymentMethods;
        };

        /**
		 * Build object with confirmation and cancel URLs
		 * @param {boolean} sfraFlag if method was called from sfra controller
		 * @returns {Object} simple object contained URLs
		 */
        self.getMerchant = function (sfraFlag) {
            var merchant = {
                'user_confirmation_url' : web.URLUtils.https('Affirm-Confirmation').toString(),
                'user_cancel_url' : web.URLUtils.https( sfraFlag ? 'Checkout-Begin' : 'COBilling-Start' ).toString(),
                'user_confirmation_url_action' : 'GET'
            };

            return merchant;
        };

        self.getDiscounts = function (basket) {
            var items = self.getItems(basket);
            var orderLevelDiscounts = getOrderLevelDiscounts(basket)
            var productLevelDiscounts = getProductDiscountsAdjustments(items, basket)
            var discountCollect = orderLevelDiscounts.concat(productLevelDiscounts)
            var discount = {};
            if (discountCollect.length > 0) {
                discountCollect.forEach(function(elem, i) {
                    var discountLine = {
                        'discount_amount' : elem.discount_amount,
                        'discount_display_name' : elem.discount_display_name
                    }
                    var discountLineName = "discount_" + i
                    discount[discountLineName] = discountLine;
                })
            }
            return discount;
        };

        /**
		 * Build object with metadata
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {Object} simple object contained metadata
		 */
        self.getMetadata = function (basket, sfraFlag, sgControllersFlag) {
            var compatibilityMode = (system.System.compatibilityMode / 100).toString();
            compatibilityMode = compatibilityMode.split('.').map(function(val, i){
                if(i != 1) {
                    return val;
                }
                return val.replace("0", "");
            }).join('.');
            var controller_type = sfraFlag ? "_sfra" : (sgControllersFlag ? "_controllers" : "_pipelines")
            var platform_version = affirmUtils.getPlatformVersion() + controller_type
            var metadata = {
                'shipping_type' : basket.getDefaultShipment().getShippingMethod() ? basket.getDefaultShipment().getShippingMethod().getDisplayName() : "other",
                'platform_version': platform_version,
                'platform_type': web.Resource.msg('metadata.platform_type', 'affirm', null),
                'platform_affirm': web.Resource.msg('metadata.platform_affirm', 'affirm', null),
                'mode': system.Site.getCurrent().getCustomPreferenceValue('AffirmModalEnable').value
            };

            return metadata;
        };

        /**
		 * Return shipping amount in cents
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {number} shipping amount in cents
		 */
        self.getShippingAmmout = function (basket) {
            var shippingAmount = basket.getDefaultShipment().getShippingTotalPrice().multiply(100).getValue();

            return shippingAmount;
        };

        /**
		 * Return tax amount in cents
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {number} tax amount in cents
		 */
        self.getTaxAmount = function (basket) {
            var taxAmount = basket.getTotalTax().multiply(100).getValue();

            return taxAmount;
        };

        /**
		 * Return total amount in cents
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {number} total amount in cents
		 */
        self.getTotal = function (basket) {
            var total = affirmUtils.calculateNonGiftCertificateAmount(basket).multiply(100).getValue();

            return total;
        };

        /**
		 * Create Affirm payment instrument
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {dw.order.PaymentInstrument} payment instrument
		 */
        self.createPaymentInstrument = function (basket) {
            self.removePaymentInstrument(basket);
            var amount = affirmUtils.calculateNonGiftCertificateAmount(basket);
            return basket.createPaymentInstrument('Affirm', amount);
        };

        /**
		 * Remove Affirm payment instrument
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 */
        self.removePaymentInstrument = function (basket) {
            var paymentInstruments = basket.getPaymentInstruments('Affirm').iterator();

            while (!empty(paymentInstruments) && paymentInstruments.hasNext()) {
                let paymentInstrument = paymentInstruments.next();
                basket.removePaymentInstrument(paymentInstrument);
            }
        };

        /**
		 * Build object with checkout data
		 *
		 * @param {Object} param ignored
         * @param {boolean} sfraFlag if method was called from sfra
		 * @returns {string} checkout data object in JSON format
		 */
        self.getCheckout = function (param, sfraFlag, sgControllersFlag) {
            var basket = BasketMgr.getCurrentBasket();
            sfraFlag = sfraFlag ? sfraFlag : false;
            if(sfraFlag){
                Transaction.wrap(function () {
	        		HookMgr.callHook('dw.order.calculate', 'calculate', basket);
	    		});
            }
            var checkoutObject = {
                'merchant' : self.getMerchant(sfraFlag),
                'items' : self.getItems(basket),
                'billing' : self.getBillingAddress(basket),
                'shipping': self.getShippingAddress(basket),
                'discounts' : self.getDiscounts(basket),
                'metadata' : self.getMetadata(basket, sfraFlag, sgControllersFlag),
                'shipping_amount' : self.getShippingAmmout(basket),
                'tax_amount' : self.getTaxAmount(basket),
                'total' : self.getTotal(basket),
                'currency' : basket.getCurrencyCode()
            };
            var fpName = self.utils.getFPNameByBasket(basket);
            if (fpName) {
                checkoutObject["financing_program"] = fpName;
            }
            checkoutObject = JSON.stringify(checkoutObject);
            var logger = require('dw/system').Logger.getLogger('Affirm', '');
            logger.debug('Generating checkout object:\n' + checkoutObject);
            return checkoutObject;
        };

        /**
		 * Compare basket and Affirm response object to avoid differences
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @param {Object} AffirmResponse affirm response
		 * @returns {dw.system.Status} status object
		 */
        self.syncBasket = function (basket, AffirmResponse) {

            var AffirmStatus = new system.Status();

            affirmUtils.checkTotalPrice(basket, AffirmResponse, AffirmStatus);
            affirmUtils.checkGiftCertificates(basket, AffirmStatus);

            return AffirmStatus;
        };

        /**
         * Returns all order discount as array of objects that can be accepted by Affirm API
         * @param {dw.order.Basket} basket SFCC basket
         * @returns {Array} of discounts objects
         */
        function getOrderLevelDiscounts (basket) {
            return basket.getPriceAdjustments().toArray().map(function (elem) {
                var discount_display_name = '';
                if (!empty(elem.couponLineItem)) {
                    discount_display_name = elem.couponLineItem.couponCode;
                } else {
                    discount_display_name = elem.promotionID
                }
                return {
                    discount_amount: elem.price.multiply(-100).getValue(),
                    valid: true,
                    discount_display_name: discount_display_name
                }
            });
        }

        /**
         * Collects total price of productLineItem along with dependent optionProductLineItems into a single number.
         * @param {dw.order.ProductLineItem} productLineItem line item to calculate total price
         * @returns {number} total price value
         */
        function getTotalPriceWithSelectedOptions(productLineItem) {
            return productLineItem.getOptionProductLineItems().toArray().reduce(function(sum, optionPLI){
                return sum + optionPLI.getAdjustedNetPrice().getValue();
            }, productLineItem.getAdjustedNetPrice().getValue())
        }

        /**
         * Creates discount objects based on differences between item price and same product price in basket.
         * Needed for cases, when product level discounts are applied only during basket calculation (e.g. buy 100$ of product X and receive 15% discount for it)
         * @param {Array} affirmItems List of objects retrieved from Affirm API
         * @param {dw.order.Basket} basket SFCC basket
         * @returns {Array} of discounts objects
         */
        function getProductDiscountsAdjustments(affirmItems, basket) {
            var result = []
            basket.getProductLineItems().toArray().forEach(function (elem) {
                var relevantProducts = affirmItems.filter(function(item){
                    return item.sku === elem.getProductID()
                })
                if (relevantProducts.length > 0) {
                    var comparedItem = relevantProducts[0];
                    var pliPrice = Math.round(getTotalPriceWithSelectedOptions(elem) * 100)
                    var priceDifference = (comparedItem.unit_price * comparedItem.qty) - pliPrice;
                    if (priceDifference !== 0)
                        result.push({
                            discount_amount: priceDifference,
                            valid: true,
                            discount_display_name: comparedItem.display_name
                        });
                }
            });

            return result;
        }

        /**
         * Collects discounts that are available after basket calculation and returns them in format accptable by Affirm API
         * @param {Array} affirmItems List of objects retrieved from Affirm API
         * @param {dw.order.Basket} basket SFCC basket
         * @returns {Array} of discounts objects
         */
        this.collectDiscounts = function (affirmItems, basket) {
            var result = [];
            var orderLevelDiscounts = getOrderLevelDiscounts(basket)
            var productDiscounts = getProductDiscountsAdjustments(affirmItems, basket)
            return result
                .concat(replaceDiscountDisplayName(orderLevelDiscounts))
                .concat(replaceDiscountDisplayName(productDiscounts));
        }

        /**
         * Returns discount objects in a format compatible with CreateOrder route for Express Checkout by replacing discount_display_name with discount_code
         * @param {Array} discounts List of discount objects from either getOrderLevelDiscounts or getProductDiscoutsAdjustments
         * @returns {Array} of discounts objects
         */
        function replaceDiscountDisplayName(discounts) {
            var result = []
            discounts.forEach(function(discount) {
                if ('discount_display_name' in discount) {
                    discount.discount_code = discount.discount_display_name
                    delete discount.discount_display_name
                }
                result.push(discount)
            })
            return result;
        }
    };

    module.exports = new Basket();
}());
