/**
 * This script provides utility functions shared across other Affirm related scripts.
 * 
 */
(function () {
    var Utils = function () {
        let self = this,
            web = require('dw/web'),
            system = require('dw/system'),
            dwutil = require('dw/util'),
            affirmData = require('*/cartridge/scripts/data/affirmData'),
            Calendar = require('dw/util/Calendar'),
            BasketMgr = require('dw/order/BasketMgr'),
            Money = require('dw/value/Money'),
            PromotionMgr = require('dw/campaign/PromotionMgr'),
            Promotion = require('dw/campaign/Promotion'),
            ProductMgr = require('dw/catalog/ProductMgr'),
            URLUtils = require('dw/web/URLUtils'),
            ShippingMgr = require('dw/order/ShippingMgr'),
            Shipment = require('dw/order/Shipment'),
            Transaction = require('dw/system/Transaction'),
            OrderMgr = require('dw/order/OrderMgr'),
            HashMap = require('dw/util/HashMap'),
            PaymentMgr = require('dw/order/PaymentMgr'),
            ArrayList = require('dw/util/ArrayList'),
            productImageViewtype = 'large';
			
        /**
		 * Calculate non-gift certificate amount
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @returns {dw.value.Money} simple object with name and shipping address
		 */
        self.calculateNonGiftCertificateAmount = function (basket) {
            let basketTotal = basket.getTotalGrossPrice(),
                giftCertTotal = new Money(0.0, basket.currencyCode),
                giftCertificatePaymentInstrs = basket.getGiftCertificatePaymentInstruments().iterator();
		
            while (!empty(giftCertificatePaymentInstrs) && giftCertificatePaymentInstrs.hasNext()) {
                let orderPI = giftCertificatePaymentInstrs.next();
                giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
            }
			
            return basketTotal.subtract(giftCertTotal);
        };
				
        /**
		 * Compare total price from basket and from affirm response.
		 * If they are not identical, add error to status object
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @param {Object} AffirmResponse charge object
		 * @param {dw.system.Status} status SFCC status
		 */
        self.checkTotalPrice = function (basket, AffirmResponse, status) {
            let totalPrice = self.calculateNonGiftCertificateAmount(basket).multiply(100).getValue();
            var logger = system.Logger.getLogger('Affirm', '');
            if (totalPrice !== AffirmResponse.details.total) {
                logger.error('Affirm check total price is failing');
                status.addItem(
                    new system.StatusItem(
                        system.Status.ERROR,
                        '',
                        web.Resource.msgf(
                            'basket.missing.total',
                            'affirm',
                            null,
                            self.calculateNonGiftCertificateAmount(basket).toFormattedString()
                        ),
                        ''
                    )
                );
            }
        };
		
        self.checkAddresses	= function (basket, AffirmResponse, status) {
        };
		
        self.responseParser = function (svc, client) {
            var response;
            switch (client.statusCode) {
                case 200:
                    response = {
                        error : false,
                        response : JSON.parse(client.text)
                    };
                    break;
                case 400:
                case 401:
                case 404:
                    response = {
                        error : true,
                        response : JSON.parse(client.text)
                    };
                    break;
            }
            return response;
        };
		
        /**
		 * Check Basket for gift certificates
		 * If they are present, add error to status object
		 *
		 * @param {dw.order.Basket} basket SFCC basket
		 * @param {dw.system.Status} status SFCC basket
         * @returns {dw.system.Status} status
		 */
        self.checkGiftCertificates = function (basket, status) {
            if (!basket.getGiftCertificateLineItems().empty) {
                var logger = require('dw/system').Logger.getLogger('Affirm', '');
                logger.error('Affirm checkGiftCert is  failing');
		
                status.addItem(
                    new system.StatusItem(
                        system.Status.ERROR,
                        '',
                        web.Resource.msg(
                            'basket.giftcertificate.present',
                            'affirm',
                            null
                        ),
                        ''
                    )
                );
            }
            return status;
        };
		
        /**
		 * Get financing program details by product object
		 *
		 * @param {Object} productObj product as object
         * @param {boolean} nameOnly if only name should be returned
         * @returns {string/Object} financing program
		 */
        self.getFinancingProgramByProduct = function (productObj, nameOnly) {
			
            var product = self.getProductByObject(productObj);
			
            if (empty(product.custom.AffirmFPName)){
                return null;
            }
			
            var financingProgram = {
                'name': product.custom.AffirmFPName,
                'mode': product.custom.AffirmFPMode,
                'priority': product.custom.AffirmFPPriority
            };
            var currentTime = Date();
            if (!empty(product.custom.AffirmFPStartDate) && product.custom.AffirmFPStartDate < currentTime){
                return null;
            }
            if (!empty(product.custom.AffirmFPEndDate) && product.custom.AffirmFPEndDate > currentTime){
                return null;
            }
            if (empty(product.custom.AffirmFPName)){
                return null;
            }
            return nameOnly ? financingProgram.name : financingProgram;
        };
		
        /**
		 * Get financing program details by SFCC Product object
		 *
		 * @param {dw.catalog.Product} product SFCC product
         * @param {boolean} nameOnly if only name should be returned
         * @returns {string/Object} financing program
		 */
        self.getFinancingProgramByProductSFCC = function (product, nameOnly) {
            if (empty(product.custom.AffirmFPName)){
                return null;
            }
            var financingProgram = {
                'name': product.custom.AffirmFPName,
                'mode': product.custom.AffirmFPMode,
                'priority': product.custom.AffirmFPPriority
            };
            var currentTime = Date();
            if (!empty(product.custom.AffirmFPStartDate) && product.custom.AffirmFPStartDate < currentTime){
                return null;
            }
            if (!empty(product.custom.AffirmFPEndDate) && product.custom.AffirmFPEndDate > currentTime){
                return null;
            }
            if (empty(product.custom.AffirmFPName)){
                return null;
            }
            var test = financingProgram.name;
            return nameOnly ? financingProgram.name : financingProgram;
        };
		
        /**
		 * Get financing program details by category object
		 *
		 * @param {dw.catalog.Category} category SFCC category
         * @returns {Object} financing program
		 */
        self.getFinancingProgramByCategory = function (category) {
            if (empty(category.custom.AffirmFPName)){
                return null;
            }
            var financingProgram = {
                'name': category.custom.AffirmFPName,
                'mode': category.custom.AffirmFPMode || 'Inclusive',
                'priority': category.custom.AffirmFPPriority || 0
            };
            var currentTime = Date();
            if (!empty(category.custom.AffirmFPStartDate) && category.custom.AffirmFPStartDate < currentTime){
                return null;
            }
            if (!empty(category.custom.AffirmFPEndDate) && category.custom.AffirmFPEndDate > currentTime){
                return null;
            }
            if (empty(category.custom.AffirmFPName)){
                return null;
            }
            return financingProgram;
        };
		
        /**
		 * Get HasnMap collection contains online categories of product
		 *
		 * @param {dw.catalog.Product} product SFCC product
         * @returns {Array} categories
		 */
        self.getOnlineCategoriesByProduct = function(product){
            var categoriesCollection = new dwutil.HashMap();
            if (empty(product.onlineCategories) && product.variant) {
                product = product.variationModel.master;
            }
            var productCategoriesIterator = product.onlineCategories.iterator();
            while(productCategoriesIterator.hasNext()){
                var prodCat = productCategoriesIterator.next();
                if (!categoriesCollection.containsKey(prodCat.ID)){
                    categoriesCollection.put(prodCat.ID, prodCat);
                }
            }
            return categoriesCollection;
        };
		
        /**
		 * Get HasnMap collection contains online categories of all products from basket
		 *
		 * @param {dw.order.Basket} basket SFCC basket
         * @returns {Array} categories
		 */
        self.getOnlineCategoriesByBasket = function(basket){
            var categoriesCollection = new dwutil.HashMap();
            var productIterator = basket.getProductLineItems().iterator();
            while(productIterator.hasNext()){
                var pli = productIterator.next();
                var product = pli.product;
                if (product.variant) {
                    product = product.variationModel.master;
                }
                categoriesCollection.putAll(self.getOnlineCategoriesByProduct(product));
            }
            return categoriesCollection;
        };
		
        self.getFPByPLICollection = function(pliCollection){
            var productIterator = pliCollection.iterator();
            var fpArray = [];
            while(productIterator.hasNext()){
                var pli = productIterator.next();
                var productFP = self.getFinancingProgramByProductSFCC(pli.product);
                if (productFP !== null) {
                    fpArray.push(productFP);
                }
            }
            return fpArray;
        };
		
        self.getFPByCategoryCollection = function(categoryCollection){
            var keysIterator = categoryCollection.keySet().iterator(),
                fpArray = [];
            while (keysIterator.hasNext()){
                var category = categoryCollection.get(keysIterator.next());
                if (category){
                    var categoryFP = self.getFinancingProgramByCategory(category);
                    if (categoryFP !== null) {
                        fpArray.push(categoryFP);
                    }
                }
            }
            return fpArray;
        };
		
        self.getApplicableFinancingProgram = function(fpArray){
            if (fpArray.length == 1){
                if (self.getPromoModalByFinProgramName(fpArray[0].name)){
                    return fpArray[0];
                } else {
                    //if fin pogram is not mapped
                    return null;
                }
            }
            fpArray = fpArray.sort(function(a,b){
                return a.priority - b.priority;
            });
            if (fpArray[0].priority == fpArray[1].priority && fpArray[0].name != fpArray[1].name){
                //conflict
                return null;
            }
            if (fpArray[0].mode == 'Exclusive'){
                return null;
            }
            if (self.getPromoModalByFinProgramName(fpArray[0].name)){
                return fpArray[0];
            }
            return null;
        };
		
        /**
		 * Returns applicable financing program name by cart total
         * @param {number} total order amount
		 * @returns {string} financing program name
		 */
        self.getFinanceProgramByCartTotal = function(total){
            var map = affirmData.getCartTotalMapping();
            for (var i = 0; i < map.length; i++){
                if (map[i].split('|').length < 3){
                    continue;
                }
                [minVal, maxVal, finProgram] = map[i].split('|');
                if (empty(minVal)){
                    minVal = Number.NEGATIVE_INFINITY;
                } else {
                    minVal = new Number(minVal);
                    if (isNaN(minVal)){
                        continue;
                    }
                }
                if (empty(maxVal)){
                    maxVal = Number.POSITIVE_INFINITY;
                } else {
                    maxVal = new Number(maxVal);
                    if (isNaN(maxVal)){
                        continue;
                    }
                }
                if (minVal <= total && maxVal >= total && self.getPromoModalByFinProgramName(finProgram)){
                    return finProgram;
                }
            }
            return '';
        };
		
        /**
		 * Get product from SFRA object or returns product for controllers
         * @param {Object} productObj object
		 * @returns {Object} SFCC Product
		 */
        self.getProductByObject = function(productObj){
            try{
                var product = ProductMgr.getProduct(productObj.id)
            } catch(e) {
                var product = productObj;
            }
            return product;
        };
		
        /**
		 * Returns applicable financing program name by cart total
		 * @returns {string} financing program name
		 */
        self.getFinanceProgramByDate = function(){
            /**
             * 
             * @param {string} str date in string format
             * @returns {Date} date
             */
            function strToDate(str){
                var calendar = new Calendar();
                calendar.parseByFormat(str, "yyyy-MM-dd");
                return calendar.time;
            }
            var currentDate = new Date();
            var map = affirmData.getDateRangeMapping();
            var minDate, maxDate, finProgram;
            for (var i = 0; i < map.length; i++){
                if (map[i].split('|').length < 3){
                    continue;
                }
                [minDate, maxDate, finProgram] = map[i].split('|');
                if (empty(minDate)){
                    minDate = new Date(0);
                } else {
                    minDate = strToDate(minDate);
                }
                if (empty(maxDate)){
                    maxDate = strToDate("2999-12-31");
                } else {
                    maxDate = strToDate(maxDate);
                }
                if (minDate <= currentDate && maxDate >= currentDate && self.getPromoModalByFinProgramName(finProgram)){
                    return finProgram;
                }
            }
            return '';
        };
		
        /**
		 * Returns applicable financing program name by cart total
         * @param {dw.util.Collection} customerGroups current customer groups shopper relates to
		 * @returns {string} financing program name
		 */
        self.getFinanceProgramByCustomerGroup = function(customerGroups){
            var cgIterator = customerGroups.iterator();
            var map = affirmData.getCustomerGroupMapping();
            while(cgIterator.hasNext()){
                var customerGroup = cgIterator.next();
                for (var i = 0; i < map.length; i++){
                    if (map[i].split('|').length < 2){
                        continue;
                    }
                    [mapCG, finProgram] = map[i].split('|');
                    if (empty(mapCG)){
                        continue;
                    }
                    if (mapCG == customerGroup.ID && self.getPromoModalByFinProgramName(finProgram)){
                        return finProgram;
                    }
                }
            }
			
            return '';
        };
		
        /**
		 * Get financing program details basket content
		 *
		 * @param {dw.order.Basket} basket SFCC basket
         * @returns {Object} financing program
		 */
        self.getFPNameByBasket = function(basket){
            var fpArray = self.getFPByPLICollection(basket.getProductLineItems());
            var finProgram, cartTotal;
			
            if (fpArray.length){
                finProgram = self.getApplicableFinancingProgram(fpArray);
                if (finProgram){
                    return finProgram.name;
                }
            }
			
            var categoriesCollection = self.getOnlineCategoriesByBasket(basket);
            fpArray = self.getFPByCategoryCollection(categoriesCollection);
            if (fpArray.length){
                finProgram = self.getApplicableFinancingProgram(fpArray);
                if (finProgram){
                    return finProgram.name;
                }
            }
			
            //cart total
            if (basket.totalGrossPrice.available){
                cartTotal = basket.totalGrossPrice;
            } else {
                cartTotal = basket.getAdjustedMerchandizeTotalPrice(true);
            }
            finProgram = self.getFinanceProgramByCartTotal(cartTotal.getValue());
            if (finProgram){
                return finProgram;
            }
            var customer = session.customer;
            finProgram = self.getFinanceProgramByCustomerGroup(customer.customerGroups);
            if (finProgram){
                return finProgram;
            }
			
            finProgram = self.getFinanceProgramByDate();
            if (finProgram){
                return finProgram;
            }
			
            return affirmData.getDefaultFinancingProgram();
        };
		
        self.getFPNameForPLP = function(categoryParam, productObj) {
            var categoryID = ''
            if(!categoryParam){
                var product = self.getProductByObject(productObj);
                if (product && product.primaryCategory){
                    categoryID = product.primaryCategory.ID;
                }
                else{
                    return '';
                }
            } else {
                categoryID = categoryParam;
            }
			
            var finProgram = self.getFinancingProgramByProduct(productObj, true);
            if (finProgram && self.getPromoModalByFinProgramName(finProgram)){
                return finProgram;
            }
            var categoriesCollection = new dwutil.HashMap();
            categoriesCollection.put(categoryID, require('dw/catalog/CatalogMgr').getCategory(categoryID));
            var fpArray = self.getFPByCategoryCollection(categoriesCollection);
            if (fpArray.length){
                finProgram = self.getApplicableFinancingProgram(fpArray);
                if(finProgram){
                    return finProgram && finProgram.name;
                }
            }
            return affirmData.getDefaultFinancingProgram();
        };
		
        self.getFPNameForPDP = function(productObj){
            var product = self.getProductByObject(productObj);
            var finProgram = self.getFinancingProgramByProductSFCC(product, true);
            if (finProgram && self.getPromoModalByFinProgramName(finProgram)){
                return finProgram;
            }
            var categoriesCollection = self.getOnlineCategoriesByProduct(product);
            var fpArray = self.getFPByCategoryCollection(categoriesCollection);
            if (fpArray.length){
                finProgram = self.getApplicableFinancingProgram(fpArray);
                if(finProgram){
                    return finProgram && finProgram.name;
                }
            }
            return affirmData.getDefaultFinancingProgram();
        };
		
        self.getPromoModalByFinProgramName = function(fpname){
            var map = system.Site.current.getCustomPreferenceValue("AffirmFPMapping");
            for (var i = 0; i < map.length; i++){
                var elem = map[i].split("|");
                if (elem[0] == fpname){
                    return {
                        promoID: elem[1],
                        modalID: elem[2]
                    }
                }
            }
            return null;
        };
		
        self.calculateProductSetPrice = function(productSet){
            var psProductsIterator = productSet.productSetProducts.iterator();
            var basket = BasketMgr.getCurrentOrNewBasket();
            var psPrice = new Money(0, basket.currencyCode);
			
            while(psProductsIterator.hasNext()){
                var psProduct = psProductsIterator.next();
                var psProductPriceModel = psProduct.priceModel;
                var promos = PromotionMgr.activeCustomerPromotions.getProductPromotions(psProduct).iterator();
                var promotionalPrice;
                var promo;
                while (promos.hasNext()) {
                    promo = promos.next();
                    if (promo.getPromotionClass()!= null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT)) {
                        if (psProduct.optionProduct) {
                            promotionalPrice = promo.getPromotionalPrice(psProduct, psProduct.getOptionModel());
                        } else {
                            promotionalPrice = promo.getPromotionalPrice(psProduct);
                        }
                        break;
                    }
                }
                if (promotionalPrice && promotionalPrice.available){
                    psPrice = psPrice.add(promotionalPrice);
                } else if (psProductPriceModel.price.available){
                    psPrice = psPrice.add(psProductPriceModel.price);
                } else if (psProductPriceModel.minPrice.available){
                    psPrice = psPrice.add(psProductPriceModel.minPrice);
                }
            }
            return psPrice;
        };
		
        self.checkBasketTotalRange = function(basket){
            var basketTotal;
            if (basket.totalGrossPrice.available){
                basketTotal = basket.totalGrossPrice;
            } else {
                basketTotal = basket.getAdjustedMerchandizeTotalPrice(true).add(basket.giftCertificateTotalPrice);
            }
            var paymentMinTotal = affirmData.getAffirmPaymentMinTotal(),
                paymentMaxTotal = affirmData.getAffirmPaymentMaxTotal();
            if (paymentMinTotal && basketTotal.value < paymentMinTotal){
                return false;
            }
            if (paymentMaxTotal && basketTotal.value > paymentMaxTotal){
                return false;
            }
            return true;
        };
		
		
        self.calculateBasePrice = function(product, salePrice, currencyCode) {
		    var promo = PromotionMgr.activeCustomerPromotions.getProductPromotions(product);
		    var PromotionalPrice = 0;
		    if (promo.length > 0) {
		    	PromotionalPrice = promo[0].getPromotionalPrice(product, product.getOptionModel()).value;
		    }
		    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
		    var Pbooks = PriceBookMgr.getSitePriceBooks();
		    var PriceModel = product.getPriceModel();
		    var price;
		    var minprice = salePrice.value;
		    for (var i = 0; i < Pbooks.length; i++) {
		        if (Pbooks[i].currencyCode == currencyCode) {
		            price = PriceModel.getPriceBookPrice(Pbooks[i].ID);
		            if ((price.available) && (price.value < minprice)) {
		                minprice = price.value;
		            }
		        }
		    }
		    if ((PromotionalPrice != 0) && (PromotionalPrice < minprice)) {
		        return PromotionalPrice;
		    } else {
		        return minprice;
		    }
        };

        /** Extracts all optionId/optionValuesId pairs as array of Objects
		* @param {dw.catalog.ProductOptionModel} optionModel product option model where values will be extracted from
		* @returns {Array} array of Objects
		*/
        function extractOptionsWithValues(optionModel) {
            var options = optionModel.getOptions().toArray();
            return options.map(function(opt){
                var option = {};
                option.optionId = opt.getID();
                var value = optionModel.getSelectedOptionValue(opt).getID()
                option.selectedValueId = value;
                return option;
            });
        }

        /** Calculates incremental price of all selected options for current optionModel
		* @param {dw.catalog.ProductOptionModel} optionModel current product option model 
		* @returns {number} incremental price float value
		*/
        self.getIncrementalOptionsPrice = function(optionModel) {
            if (optionModel) {
                var options = optionModel.getOptions().toArray();
                return options.reduce(function(sum, opt){
                    var optionValue = optionModel.getSelectedOptionValue(opt);
                    return sum += optionModel.getPrice(optionValue).getValue();
                }, 0);
            } else return 0;
        }

        /** Gets image url for provided product
		* @param {dw.catalog.Product} product current product
		* @returns {string} url
		*/
        function getImageUrl(product) {
            var productImage = product.getImage(productImageViewtype);
		    return productImage ? productImage.getHttpsURL().toString() : URLUtils.staticURL('/images/noimagelarge.png').toString();
        }

        /** Calculates unit price based on price catalogs and selected options values
		* @param {dw.catalog.Product} product current product
		* @param {dw.catalog.ProductOptionModel} optionModel current product option model 
		* @param {string} currencyCode current website currency code
		* @returns {number} rounded price in cents
		*/
        function getUnitPrice(product, optionModel, currencyCode) {
            var salePrice = product.priceModel.getMaxPrice();
		    var result = self.calculateBasePrice(product, salePrice, currencyCode);
            if (optionModel) {
                result += self.getIncrementalOptionsPrice(optionModel)
            }
            return Math.round(result * 100)
        }


        /** Creates object for sending to Affirm api for checkout. Gets catalog product as a source
		* @param {dw.catalog.Product} product SFCC product 
		* @param {string} currencyCode current website currency code
		* @returns {Object} object that follows Affirm api requirements
		*/
        function createAffirmCheckoutItemFromProduct(product, currencyCode){
            var payload = {};
		        var productImageUrl = getImageUrl(product);
            var om = product.getOptionModel();
            if (om) {
                payload.productOptions = extractOptionsWithValues(om);
            }     
            var unitPrice = getUnitPrice(product, om, currencyCode); // The item's price in cents
		        return{
	                display_name: product.name,
	                unit_price: unitPrice,
	                qty: 1,
	                sku: product.getID(),
	                item_image_url: productImageUrl,
	                item_url: URLUtils.https("Product-Show", "pid", product.getID()).toString(),
                options: payload
	            };
        }

        /** Creates object for sending to Affirm api for checkout. Takse productLineItem as source
		* @param {dw.order.productLineItem} productLineItem basket product line item 
		* @param {string} currencyCode current website currency code
		* @returns {Object} object that follows Affirm api requirements
		*/
        function createAffirmCheckoutItemFromPLI(productLineItem, currencyCode){
            var payload = {};
            var Product = ProductMgr.getProduct(productLineItem.productID);
            var productImageUrl = getImageUrl(Product);
            var om = productLineItem.getOptionModel();
            if (om) {
                payload.productOptions = extractOptionsWithValues(om);
            }
            var unitPrice = productLineItem.isBonusProductLineItem() ? 
                0 : 
                getUnitPrice(Product, om, currencyCode);

            return {
                display_name: productLineItem.productName,
                unit_price: unitPrice,     // The item's price in cents
                qty: productLineItem.quantityValue,
                sku: productLineItem.productID,
                item_image_url: productImageUrl,
                item_url: URLUtils.https("Product-Show", "pid", productLineItem.productID).toString(),
                options: payload
            };
        } 
		
		
        self.getCheckoutItemsObject = function(productId, currencyCode) {
            var productsList = new Array();
            if (productId) {
                var product = ProductMgr.getProduct(productId);
                if (product.isProductSet()){
                    product.getProductSetProducts().toArray().forEach(function(setItem){
                        var vm = setItem.getVariationModel();
                        var origin = vm.getDefaultVariant() || setItem;
                        productsList.push(createAffirmCheckoutItemFromProduct(origin, currencyCode));
                    });
                } else {
                    productsList.push(createAffirmCheckoutItemFromProduct(product, currencyCode));
                }
				
            } else {
                var basket = BasketMgr.getCurrentOrNewBasket();
                var productLineItems = basket.getAllProductLineItems().iterator();
                while (productLineItems.hasNext()) {
	                var pli = productLineItems.next();
                    if (!pli.isOptionProductLineItem() && !pli.isBundledProductLineItem()){ // Option and bundleItems pli are not pushed as separate products
                        productsList.push(createAffirmCheckoutItemFromPLI(pli, currencyCode));
                    } 
                }
            }
	        return productsList;
        };

        self.getPlatformVersion = function() {
		    var compatibilityMode = (system.System.compatibilityMode / 100).toString();
            return compatibilityMode.split('.').map(function(val, i){
                if(i != 1) {
                    return val;
                }
                return val.replace("0", "");
            }).join('.');
        };
		
        self.updateShipmentShippingMethod = function(shipmentID, shippingMethodID, shippingMethod, shippingMethods) {
            var basket = BasketMgr.getCurrentOrNewBasket();
            var shipment = basket.getShipment(shipmentID);

	        if (!shippingMethods) {
	            shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();
	        }
	
	        // Tries to set the shipment shipping method to the passed one.
	        for (var i = 0; i < shippingMethods.length; i++) {
	            var method = shippingMethods[i];
	
	            if (!shippingMethod) {
	                if (!method.ID.equals(shippingMethodID)) {
	                    continue;
	                }
	            } else {
	                if (method !== shippingMethod) {
	                    continue;
	                }
	
	            }
	
	            // Sets this shipping method.
	            shipment.setShippingMethod(method);
	            return;
	        }
	
	        var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
	        if (shippingMethods.contains(defaultShippingMethod)) {
	            // Sets the default shipping method if it is applicable.
	            shipment.setShippingMethod(defaultShippingMethod);
	        } else if (shippingMethods.length > 0) {
	            // Sets the first shipping method in the applicable list.
	            shipment.setShippingMethod(shippingMethods.iterator().next());
	        } else {
	            // Invalidates the current shipping method selection.
	            shipment.setShippingMethod(null);
	        }
        };
		
        self.preCalculateShipping = function(shippingMethod) {
            var basket = BasketMgr.getCurrentOrNewBasket();
	        var shipment = basket.getDefaultShipment();
	
	        if (shipment) {
	            var currencyCode = basket.getCurrencyCode();
	            var productShippingCosts     = [], // array to hold product level shipping costs (fixed or surcharges), each entry is an object containing product name and shipping cost
	                productShippingDiscounts = new ArrayList(), // list holds all products shipping discounts NOT promotions e.g. fixed shipping discount or free shipping for individual products discount
	                productIter              = basket.getAllProductLineItems().iterator(),
	                priceAdj,
	                priceAdjArray            = [], // array to hold shipping price adjustments data (we have to create objects since price adjustments get lost after applying a shipping method
	                priceAdjIter             = shipment.getShippingPriceAdjustments().iterator(),
	                priceAdjTotal            = new Money(0.0, currencyCode), // total of all price adjustments
	                surchargeTotal           = new Money(0.0, currencyCode), // total of all surcharges
	                adustedSurchargeTotal    = new Money(0.0, currencyCode); // total of all surcharges minus price adjustments
	
	            // Iterates over all products in the basket
	            // and calculates their shipping cost and shipping discounts
	            while (productIter.hasNext()) {
	                var pli = productIter.next();
	                var product = pli.product;
	                if (product) {
	                    var psc = ShippingMgr.getProductShippingModel(product).getShippingCost(shippingMethod);
	                    productShippingCosts[productShippingCosts.length] = {
	                        name: product.name,
	                        shippingCost: psc,
	                        qty: pli.getQuantity()
	                    };
	                    if (psc && psc.getAmount() && psc.isSurcharge()) {
	                        // update the surcharge totals
	                        surchargeTotal = surchargeTotal.add(psc.getAmount());
	                        adustedSurchargeTotal = adustedSurchargeTotal.add(psc.getAmount());
	                    }
	                    //productShippingDiscounts.addAll(discountPlan.getProductShippingDiscounts(pli));
	                    //productShippingDiscounts.addAll(pli.shippingLineItem.priceAdjustments);
	                    if (pli.shippingLineItem) {
	                        var pdiscountsiter = pli.shippingLineItem.priceAdjustments.iterator();
	                        while (pdiscountsiter.hasNext()) {
	                            priceAdj = pdiscountsiter.next();
	                            if (priceAdj && priceAdj.promotion !== null) {
	                                if (pli.shippingLineItem.isSurcharge()) {
	                                    // adjust the surchage total value
	                                    adustedSurchargeTotal = adustedSurchargeTotal.add(priceAdj.price);
	                                }
	                                productShippingDiscounts.add({
	                                    price: priceAdj.price,
	                                    calloutMsg: priceAdj.promotion.calloutMsg
	                                });
	                            }
	                        }
	                    }
	                }
	            }
	
	            // Iterates over all shipping price adjustments and
	            // grabs price and calloutMsg objects.
	            while (priceAdjIter.hasNext()) {
	                priceAdj = priceAdjIter.next();
	                if (priceAdj && priceAdj.promotion !== null) {
	                    priceAdjTotal = priceAdjTotal.add(priceAdj.price);
	                    priceAdjArray[priceAdjArray.length] = {
	                        price: priceAdj.price,
	                        calloutMsg: priceAdj.promotion.calloutMsg
	                    };
	                }
	            }
	
	            var baseShipping = basket.getShippingTotalPrice().subtract(surchargeTotal);
	            var baseShippingAdjusted = null;
	            if (priceAdjTotal >= 0) {
	                baseShippingAdjusted = baseShipping.subtract(priceAdjTotal);
	            } else {
	                baseShippingAdjusted = baseShipping.add(priceAdjTotal);
	            }
	
	            return {
	                shippingExclDiscounts: basket.getShippingTotalPrice(),
	                shippingInclDiscounts: basket.getAdjustedShippingTotalPrice(),
	                productShippingCosts: productShippingCosts,
	                productShippingDiscounts: productShippingDiscounts,
	                shippingPriceAdjustments: priceAdjArray,
	                shippingPriceAdjustmentsTotal: priceAdjTotal,
	                surchargeAdjusted: adustedSurchargeTotal,
	                baseShipping: baseShipping,
	                baseShippingAdjusted: baseShippingAdjusted
	            };
	        }
	    };
		
        self.getShippingOptions = function(addressObj) {
            var basket = BasketMgr.getCurrentOrNewBasket();
		    if (!addressObj) {
		        addressObj = JSON.parse(basket.custom.AffirmShippingAddress);
		    }
	        if (!addressObj.countryCode) {
	            addressObj.countryCode = 'US';
	        }
	        if (!addressObj.stateCode) {
	            addressObj.stateCode = 'NY';
	        }
	        // Retrieves the list of applicable shipping methods for the given shipment and address.
	        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(basket.getDefaultShipment()).getApplicableShippingMethods(addressObj);
		    var currentShippingMethod = basket.getDefaultShipment().getShippingMethod() || ShippingMgr.getDefaultShippingMethod();
		    var affirmShippingOptions = [];
		    // Transaction controls are for fine tuning the performance of the data base interactions when calculating shipping methods
		    Transaction.begin();
		
		    for (var i = 0; i < applicableShippingMethods.length; i++) {
		        var shippingMethod = applicableShippingMethods[i];
		        self.updateShipmentShippingMethod(basket.getDefaultShipment().getID(), shippingMethod.getID(), shippingMethod, applicableShippingMethods);
		        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', basket);

		        var shippingCost = self.preCalculateShipping(shippingMethod);

                var baseShippingAdjusted = shippingCost.baseShippingAdjusted;
                var shippingTitle = shippingMethod.displayName;

                if ( shippingCost.surchargeAdjusted > 0 ) {
                    baseShippingAdjusted = baseShippingAdjusted.add(shippingCost.surchargeAdjusted);
                    shippingTitle += dw.web.Resource.msg('shipping.surcharge','affirm', '(with surcharge)');
                }

		        affirmShippingOptions.push({
		            "carrier_title": shippingTitle,
		            "method_title": '',
		            "price": baseShippingAdjusted.multiply(100).value,
		            "merchant_internal_method_code": shippingMethod.ID
		        });
		    }
		    Transaction.rollback();
		    return affirmShippingOptions;
        };
		
        self.setBillingAddress = function(basket, billingAddressFields, user) {
            Transaction.wrap(function () {
		    var billingAddress = basket.createBillingAddress();
		    
		    // copy the address details
		    billingAddress.setFirstName( billingAddressFields.firstName );
		    billingAddress.setLastName( billingAddressFields.lastName );
		    billingAddress.setAddress1( billingAddressFields.address1 );
		    billingAddress.setAddress2( billingAddressFields.address2 || '' );
		    billingAddress.setCity( billingAddressFields.city );
		    billingAddress.setPostalCode( billingAddressFields.postalCode );
		    billingAddress.setStateCode( billingAddressFields.stateCode );
		    billingAddress.setCountryCode( billingAddressFields.stateCode );
		    billingAddress.setPhone(user.phone_number);
		    
		    basket.setCustomerEmail(user.email);
		    });
        };
		
        self.setPayment = function(basket, paymentMethodId, isSFRA) {
		    var result;
		    if (empty(PaymentMgr.getPaymentMethod(paymentMethodId).paymentProcessor)) {
		        result = {
		            error: true,
		            MissingPaymentProcessor: true
		        };
		    }
		    if (!result) {
		    	var processor = PaymentMgr.getPaymentMethod(paymentMethodId).getPaymentProcessor();
                var processorID = isSFRA ? processor.ID.toLowerCase() : processor.ID;
			    if (dw.system.HookMgr.hasHook('app.payment.processor.' + processorID)) {
			        result = dw.system.HookMgr.callHook('app.payment.processor.' + processorID, 'Handle', {
			            Basket: basket,
			            PaymentMethodID: paymentMethodId
			        });
			    } else {
			        result = dw.system.HookMgr.callHook('app.payment.processor.default', 'Handle', {
			            Basket: basket,
			            PaymentMethodID: paymentMethodId
			        });
			    }
		    }
		    return result;
        };
    };

    module.exports = new Utils();
}());
