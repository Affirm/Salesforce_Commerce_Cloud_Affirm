var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('Affirm-Confirmation', function () {
    this.timeout(25000);

    var myRequest = {
        url: config.baseUrl + '/Affirm-Confirmation',
        method: 'GET',
        rejectUnauthorized: false,
        resolveWithFullResponse: true
    };

    it('should return 200 status code', function () {
        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected Success statusCode to be 200.');
            });
    });
});

describe('Affirm-CheckoutObject', function () {
    this.timeout(25000);

    it('should return a valid object with checkout data', function () {
        var cookieString;
        var cookieJar = request.jar();
        var myRequest = {
            url: config.baseUrl + '/Cart-AddProduct',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        myRequest.form = {
            pid: '640188017003M',
            quantity: 2
        };
        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Unable to add test product to Basket');
                cookieString = cookieJar.getCookieString(myRequest.url);
            })
                .then(function () {
                    var affirmRequest = {
                        url: config.baseUrl + '/Affirm-CheckoutObject',
                        method: 'GET',
                        rejectUnauthorized: false,
                        resolveWithFullResponse: true
                    };

                    var cookie = request.cookie(cookieString);
                    cookieJar.setCookie(cookie, affirmRequest.url);
                    affirmRequest.jar = cookieJar;
                    return request(affirmRequest)
                        .then(function (response) {
                            assert.equal(response.statusCode, 200, 'Expected CheckoutObject statusCode to be 200.');
                            var bodyObject = JSON.parse(response.body);
                            assert.containsAllKeys(bodyObject, ['affirmTotal', 'vcndata', 'enabled', 'affirmselected', 'errormessages']);
                        });
                });
    });
});


describe('Affirm-Update', function () {
    it('should return status without errors', function () {
        this.timeout(25000);

        var cookieJar = request.jar();

        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        var cookieString;


        var variantPid1 = '640188017003M';
        var qty1 = 2;
        var addProd = '/Cart-AddProduct';

    // ----- Step 1 adding product to Cart
        myRequest.url = config.baseUrl + addProd;
        myRequest.form = {
            pid: variantPid1,
            quantity: qty1
        };

        return request(myRequest)
        .then(function (addToCartResponse) {
            assert.equal(addToCartResponse.statusCode, 200, 'Unable to add test product to Basket');
            cookieString = cookieJar.getCookieString(myRequest.url);
            myRequest.url = config.baseUrl + '/CSRF-Generate';
            var cookie = request.cookie(cookieString);
            cookieJar.setCookie(cookie, myRequest.url);
            // step2 : get cookies, Generate CSRF, then set cookies
            return request(myRequest);
        })
            .then(function (csrfResponse) {
                assert.equal(csrfResponse.statusCode, 200, 'Unable to generate CSRF');
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                // step3 : make post request to Affirm-Update
                myRequest.url = config.baseUrl + '/Affirm-Update?' +
                    csrfJsonResponse.csrf.tokenName + '=' +
                    csrfJsonResponse.csrf.token;

                myRequest.form = {
                    'billing_address[city]': 'TestCity',
                    'billing_address[line1]': 'TestAddress1',
                    'billing_address[line2]': 'TestAddress2',
                    'billing_address[state]': 'TestState',
                    'billing_address[zipcode]': 'TestZipCode',
                    number: '5555555555554444',
                    cardholder_name: 'TestUser',
                    cvv: '342',
                    expiration: '0222'
                };
                return request(myRequest)
                    .then(function (response) {
                        assert.equal(response.statusCode, 200, 'Expected Update statusCode to be 200.');
                        assert.include(JSON.parse(response.body), { error: false });
                    });
            });
    });
});


describe('Affirm-UpdateShipping', function () {
    it('should return repsponce with valid response code and headers', function () {
        this.timeout(25000);

        var myRequest = {
            url: config.baseUrl + '/Affirm-UpdateShipping',
            method: 'OPTIONS',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200, 'Invalid response code');
            assert.include(response.headers, {
                'access-control-allow-origin': 'https://sandbox.affirm.com',
                'access-control-allow-methods': 'POST',
                'access-control-allow-credentials': 'true',
                'access-control-allow-headers': 'content-type'
            });
        });
    });
});

describe('Affirm-CreateOrder', function () {
    it('should return repsponce with valid response code and headers', function () {
        this.timeout(25000);

        var myRequest = {
            url: config.baseUrl + '/Affirm-CreateOrder',
            method: 'OPTIONS',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200, 'Invalid response code');
            assert.include(response.headers, {
                'access-control-allow-origin': 'https://sandbox.affirm.com',
                'access-control-allow-methods': 'POST',
                'access-control-allow-credentials': 'true',
                'access-control-allow-headers': 'content-type'
            });
        });
    });
});

describe('Affirm-ApplyDiscount', function () {
    it('should return repsponce with valid response code and headers', function () {
        this.timeout(25000);

        var myRequest = {
            url: config.baseUrl + '/Affirm-ApplyDiscount',
            method: 'OPTIONS',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200, 'Invalid response code');
            assert.include(response.headers, {
                'access-control-allow-origin': 'https://sandbox.affirm.com',
                'access-control-allow-methods': 'POST',
                'access-control-allow-credentials': 'true',
                'access-control-allow-headers': 'content-type'
            });
        });
    });
});
