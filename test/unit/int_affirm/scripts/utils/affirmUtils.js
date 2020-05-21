var assert = require('chai').assert;
var Basket = require('../../../../mocks/dw/order/Basket');
var Status = require('../../../../mocks/dw/system/Status');
var AffirmResponse = require('../../../../mocks/AffirmResponse');
var Client = require('../../../../mocks/Client');
var ProductObj = require('../../../../mocks/ProductObj');
var Product = require('../../../../mocks/dw/catalog/Product');
var Category = require('../../../../mocks/dw/catalog/Category');
var DwMap = require('../../../../mocks/dw/util/Map');
var ProductLineItem = require('../../../../mocks/dw/order/ProductLineItem');
var CustomerGroup = require('../../../../mocks/dw/customer/CustomerGroup');
var Money = require('../../../../mocks/dw/value/Money');
var ShippingMethod = require('../../../../mocks/dw/order/ShippingMethod');
var BasketMgr = require('../../../../mocks/dw/order/BasketMgr');

var affirmUtils = require('../../../filesProxyquire').affirmUtils;

describe('int_affirm/cartridge/scripts/utils/affirmUtils', function () {
    it('isObject', function () {
        assert.isObject(affirmUtils);
    });
    context('method calculateNonGiftCertificateAmount', function () {
        it('should subsctract all certificate amounts from basket total price', function () {
            var basket = new Basket();
            basket.setTestValuesForGiftCertPaymentInstruments();
            var actual = affirmUtils.calculateNonGiftCertificateAmount(basket);
            assert.equal(actual.getValue(), 125);
        });
        it('should leave amount as it is in case no gift certificates used', function () {
            var basket = new Basket();
            var actual = affirmUtils.calculateNonGiftCertificateAmount(basket);
            assert.equal(actual.getValue(), 140);
        });
    });

    context('method checkTotalPrice', function () {
        var basket;
        var response;
        var status;

        beforeEach(function () {
            basket = new Basket();
            response = new AffirmResponse(100);
            status = new Status();
        });

        it('should return void', function () {
            var actual = affirmUtils.checkTotalPrice(basket, response, status);
            assert.isUndefined(actual);
        });
        it('should leave Status without changes if response total price match basket price', function () {
            var actual = affirmUtils.checkTotalPrice(basket, new AffirmResponse(140), status);
            assert.isUndefined(actual);
            assert.isEmpty(status.storage);
        });
        it('should update Status with error in case response total price does\'t match basket price', function () {
            var actual = affirmUtils.checkTotalPrice(basket, new AffirmResponse(101), status);
            assert.isUndefined(actual);
            assert.isNotEmpty(status.storage);
            var statusItem = status.storage[0];
            assert.equal(statusItem.code, Status.ERROR);
        });
    });

    context('method responseParser', function () {
        var client;

        beforeEach(function () {
            client = new Client(200);
        });

        it('should return object with \'error\' and \'response\' fields', function () {
            var actual = affirmUtils.responseParser(null, client);
            assert.isObject(actual);
            assert.containsAllKeys(actual, ['error', 'response'], 'Response must include necessary keys');
            assert.isObject(actual.response, 'result.response property must be an object');
        });

        it('should return object with error:false property for statusCode 200', function () {
            assert.isFalse(affirmUtils.responseParser(null, client).error);
        });

        it('should return object with error:true property for statusCode 40*', function () {
            assert.isTrue(affirmUtils.responseParser(null, new Client(400)).error);
            assert.isTrue(affirmUtils.responseParser(null, new Client(401)).error);
            assert.isTrue(affirmUtils.responseParser(null, new Client(404)).error);
        });
    });

    context('method checkGiftCertificates', function () {
        var basket;
        var status;

        beforeEach(function () {
            basket = new Basket();
            status = new Status();
        });

        it('should return satus object', function () {
            var actual = affirmUtils.checkGiftCertificates(basket, status);
            assert.isObject(actual);
            assert.isTrue(actual instanceof Status);
        });

        it('should return satus without any changes if basket.getGiftCertificateLineItems() is empty', function () {
            assert.isEmpty(affirmUtils.checkGiftCertificates(basket, status).storage);
        });

        it('should return Status with error if basket.getGiftCertificateLineItems() is not empty', function () {
            basket.setTestValuesForGiftCertPaymentInstruments();
            var actual = affirmUtils.checkGiftCertificates(basket, status);
            assert.isNotEmpty(actual.storage);
            var statusItem = actual.storage[0];
            assert.equal(statusItem.code, Status.ERROR);
        });
    });

    context('method getFinancingProgramByProduct', function () {
        var productObj;
        var nameOnly;
        var actual;

        beforeEach(function () {
            productObj = new ProductObj('P123456');
            nameOnly = false;
        });

        it('should return financeProgram object', function () {
            actual = affirmUtils.getFinancingProgramByProduct(productObj, nameOnly);
            assert.isObject(actual);
            assert.containsAllKeys(actual, ['name', 'mode', 'priority']);
        });

        it('should return finance program name string if nameOnly parameter is true', function () {
            nameOnly = true;
            actual = affirmUtils.getFinancingProgramByProduct(productObj, nameOnly);
            assert.isString(actual);
            assert.isOk(actual);
        });
    });

    context('method getFinancingProgramByProductSFCC', function () {
        var product;
        var nameOnly;
        var actual;

        beforeEach(function () {
            product = new Product('P123456');
            nameOnly = false;
        });

        it('should return financeProgram object', function () {
            actual = affirmUtils.getFinancingProgramByProductSFCC(product, nameOnly);
            assert.isObject(actual);
            assert.containsAllKeys(actual, ['name', 'mode', 'priority']);
        });

        it('should return finance program name string if nameOnly parameter is true', function () {
            nameOnly = true;
            actual = affirmUtils.getFinancingProgramByProductSFCC(product, nameOnly);
            assert.isString(actual);
            assert.isOk(actual);
        });
    });

    context('method getFinancingProgramByCategory', function () {
        it('should return financeProgram object', function () {
            var actual = affirmUtils.getFinancingProgramByCategory(new Category());
            assert.isObject(actual);
            assert.containsAllKeys(actual, ['name', 'mode', 'priority']);
        });
    });

    context('method getOnlineCategoriesByProduct', function () {
        it('should return categories Map collection', function () {
            var actual = affirmUtils.getOnlineCategoriesByProduct(new Product());
            assert.isObject(actual);
            assert.isTrue(actual instanceof DwMap);
            assert.sameMembers(actual.keySet(), ['Men', 'Suits']);
        });
    });

    context('method getOnlineCategoriesByBasket', function () {
        it('should return categories Map collection', function () {
            var actual = affirmUtils.getOnlineCategoriesByBasket(new Basket());
            assert.isObject(actual);
            assert.isTrue(actual instanceof DwMap);
            assert.sameMembers(actual.keySet(), ['Men', 'Suits']);
        });
    });

    context('method getFPByPLICollection', function () {
        it('should return array of financing program objects', function () {
            var productLineItems = [new ProductLineItem(new Product('P123456')), new ProductLineItem(new Product('pd65432'))];
            var actual = affirmUtils.getFPByPLICollection(productLineItems);
            assert.isArray(actual);
            assert.lengthOf(actual, productLineItems.length);
            for (var x = 0; x < actual.length; x++) {
                assert.containsAllKeys(actual[x], ['name', 'mode', 'priority']);
            }
        });
    });

    context('method getFPByCategoryCollection', function () {
        it('should return array of financing program objects', function () {
            var categoryCollection = new DwMap();
            categoryCollection.put('Men', new Category('Men'));
            categoryCollection.put('Suits', new Category('Suits'));
            var actual = affirmUtils.getFPByCategoryCollection(categoryCollection);
            assert.isArray(actual);
            assert.lengthOf(actual, categoryCollection.getLength());
            for (var x = 0; x < actual.length; x++) {
                assert.containsAllKeys(actual[x], ['name', 'mode', 'priority']);
            }
        });
    });

    context('method getApplicableFinancingProgram', function () {
        it('should return single FP object out of fpArray', function () {
            var productLineItems = [new ProductLineItem(new Product('P123456')), new ProductLineItem(new Product('pd65432'))];
            var fpArray = affirmUtils.getFPByPLICollection(productLineItems);
            var actual = affirmUtils.getApplicableFinancingProgram(fpArray);
            assert.isObject(actual);
            assert.containsAllKeys(actual, ['name', 'mode', 'priority']);
        });
    });

    context('method getFinanceProgramByCartTotal', function () {
        it('should return finProgram name if total is within FP range', function () {
            var actual = affirmUtils.getFinanceProgramByCartTotal(150);
            assert.isString(actual);
            assert.equal(actual, 'GoldPriceFinProgram');
        });
        it('should return empty string if total is out of all program rages', function () {
            var actual = affirmUtils.getFinanceProgramByCartTotal(10);
            assert.isString(actual);
            assert.isEmpty(actual);
            actual = affirmUtils.getFinanceProgramByCartTotal(1000);
            assert.isString(actual);
            assert.isEmpty(actual);
        });
    });

    context('method getFinanceProgramByDate', function () {
        it('should return finProgram name if total is within FP time rage', function () {
            var actual = affirmUtils.getFinanceProgramByDate();
            assert.isString(actual);
            assert.equal(actual, 'ThisYearFinProgram');
        });
    });

    context('method getFinanceProgramByCustomerGroup', function () {
        it('should return finProgram name for provided customer groups', function () {
            var customerGroups = [new CustomerGroup('Registered'), new CustomerGroup('Men')];
            var actual = affirmUtils.getFinanceProgramByCustomerGroup(customerGroups);
            assert.isString(actual);
            assert.equal(actual, 'PremiumFinProgram');
        });
    });

    context('method getProductByObject', function () {
        it('should return dw.catalog.Product found by id of provided product', function () {
            var productObj = new ProductObj('P123456');
            var actual = affirmUtils.getProductByObject(productObj);
            assert.isObject(actual);
            assert.isTrue(actual instanceof Product);
            assert.equal(actual.getID(), productObj.id);
        });
    });

    context('method getFPNameByBasket', function () {
        it('should return finProgram based on provided basket', function () {
            var basket = new Basket();
            var actual = affirmUtils.getFPNameByBasket(basket);
            assert.isString(actual);
            assert.equal(actual, 'DefaultFinProgram');
        });
    });

    context('method getFPNameForPLP', function () {
        it('should return relevant finProgram name', function () {
            var productObj = new ProductObj('P123456');
            var actual = affirmUtils.getFPNameForPLP('Men', productObj);
            assert.isString(actual);
            assert.equal(actual, 'DefaultFinProgram');
        });
    });

    context('method getFPNameForPDP', function () {
        it('should return relevant finProgram name', function () {
            var productObj = new ProductObj('P123456');
            var actual = affirmUtils.getFPNameForPDP(productObj);
            assert.isString(actual);
            assert.equal(actual, 'DefaultFinProgram');
        });
    });

    context('method calculateProductSetPrice', function () {
        it('should return totalPrice for all set Products', function () {
            var productSet = new Product('P123456');
            productSet.setTestValueProductSetProducts();
            var actual = affirmUtils.calculateProductSetPrice(productSet);
            assert.isObject(actual);
            assert.isTrue(actual instanceof Money);
            assert.equal(actual.getValue(), 240);
        });
    });

    context('method checkBasketTotalRange', function () {
        it('should return true if total basket price is within finance program range', function () {
            var basket = new Basket();
            assert.isTrue(affirmUtils.checkBasketTotalRange(basket));
        });
    });


    context('method calculateBasePrice', function () {
        it('should return promotional price if it\'s cheaper than minimal pricebook price', function () {
            var product = new Product('testProduct', 100);
            var salePrice = new Money(100);
            var currencyCode = 'USD';
            assert.equal(affirmUtils.calculateBasePrice(product, salePrice, currencyCode), 90);
        });
    });

    context('method getCheckoutItemsObject', function () {
        it('should return object with product details', function () {
            var productId = 'P123456';
            var currencyCode = 'USD';
            var result = affirmUtils.getCheckoutItemsObject(productId, currencyCode);
            assert.isArray(result);
            result.forEach(function (item) {
                assert.containsAllKeys(item, ['display_name', 'unit_price', 'qty', 'sku', 'item_image_url', 'item_url', 'options']);
            });
        });
    });

    context('method getPlatformVersion', function () {
        it('should return object with product details', function () {
            var result = affirmUtils.getPlatformVersion();
            assert.equal(result, '19.1');
        });
    });

    context('method updateShipmentShippingMethod', function () {
        it('should update used shipment method', function () {
            BasketMgr.setTestBasketKeepingMode(true);
            var shipmentID = 'testShipmentID';
            var shippingMethodID = 'testShippingMethodID';
            var shippingMethod = new ShippingMethod('testShippingMethodID');
            var shippingMethods = [shippingMethod, new ShippingMethod('shippingMethodID2')];
            affirmUtils.updateShipmentShippingMethod(shipmentID, shippingMethodID, shippingMethod, shippingMethods);
            try {
                assert.equal(BasketMgr.getCurrentBasket().getShipment(shipmentID).getShippingMethod().getID(), 'testShippingMethodID');
            } finally {
                BasketMgr.setTestBasketKeepingMode(false);
            }
        });
    });

    context('method preCalculateShipping', function () {
        it('should return object with detailed shipping cost information', function () {
            var shippingMethod = new ShippingMethod('testShippingMethodID');
            var result = affirmUtils.preCalculateShipping(shippingMethod);
            assert.isObject(result);
            assert.containsAllKeys(result, ['shippingInclDiscounts', 'productShippingCosts', 'productShippingDiscounts', 'shippingPriceAdjustments', 'shippingPriceAdjustmentsTotal', 'surchargeAdjusted', 'baseShipping', 'baseShippingAdjusted']);
        });
    });

    context('method getShippingOptions', function () {
        it('should return object with detailed shipping cost information', function () {
            var addressObj = {};
            var result = affirmUtils.getShippingOptions(addressObj);
            assert.isArray(result);
            result.forEach(function (item) {
                assert.containsAllKeys(item, ['carrier_title', 'method_title', 'price', 'merchant_internal_method_code']);
            });
        });
    });

    context('method setBillingAddress', function () {
        it('should create billing address within basket and fill with data from provided objects', function () {
            var basket = new Basket();
            var billingAddressFields = {
                firstName: 'Richard',
                lastName: 'Gier',
                address1: 'Imaginary address 16b',
                city: 'New-York',
                postalCode: '173456',
                stateCode: '654371'
            };

            var user = {
                email: 'testEmail@test.com',
                phone_number: '855-111-2456-23'
            };
            affirmUtils.setBillingAddress(basket, billingAddressFields, user);
            assert.include(basket.getBillingAddress(), billingAddressFields);
            assert.include(basket.getBillingAddress(), { phone: user.phone_number });
        });
    });

    context('method setPayment', function () {
        it('should not return object with errors', function () {
            var basket = new Basket();
            var paymentMethodId = 'testPaymentMethodID';
            var isSFRA = true;
            var actual = affirmUtils.setPayment(basket, paymentMethodId, isSFRA);
            assert.isUndefined(actual);
        });
    });


    context('method getPromoModalByFinProgramName', function () {
        it('should return object with promoID and modalID', function () {
            var actual = affirmUtils.getPromoModalByFinProgramName('DefaultFinProgram');
            assert.isObject(actual);
            assert.containsAllKeys(actual, ['promoID', 'modalID']);
        });
    });
});
