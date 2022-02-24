(function () {
    /**
     * Creates library-wrapper for Affirm API
     *
     * @constructor
     * @this {Api}
     */
    var Api = function () {
        var self = this;
        var affirmData = require('*/cartridge/scripts/data/affirmData');
        var logger = require('dw/system').Logger.getLogger('Affirm', '');

        /**
         * Get charge object by token
         *
         * @param {string} token that was POSTed to the SFRA controller CheckoutServices-PlaceOrder or controller COPlaceOrder-Start
         * @returns {Object} charge object
         */
        self.auth = function (token) {
            try {
                var affirmService = require('*/cartridge/scripts/init/initAffirmServices').initService('affirm.auth');
                affirmService.URL = affirmData.getURLPath() + '/v1/transactions';
                var response = affirmService.call({
                    'transaction_id': token
                }).object;
                return response;
            } catch (e) {
                logger.error('Affirm. File - affirmAPI. Error - {0}', e);
                return {
                    error : false
                };
            }
        };
        /**
         * Capture charge by charge ID
         *
         * @param {string} chargeId charge id
         * @param {string} captureData order id
         * @returns {Object} charge capture event object
         */
        self.capture = function (chargeId, order_id, amount) {
            try {
                var affirmService = require('*/cartridge/scripts/init/initAffirmServices').initService('affirm.capture');
                affirmService.URL = affirmData.getURLPath() + '/v1/transactions/' + chargeId + '/capture';
                var data = {};
                if (order_id) {
                    data['order_id'] = order_id;
                }
                if (amount) {
                    data['amount'] = amount;
                }
                var response = affirmService.call(data).object;
                return response;
            } catch (e) {
                logger.error('Affirm. File - affirmAPI. Error - {0}', e);
                return { error : false }
            }
        };
        /**
         * Void charge by charge ID
         *
         * @param {string} chargeId charge id
         * @returns {Object} charge void event object
         */
        self.void = function (chargeId) {
            try {
                var affirmService = require('*/cartridge/scripts/init/initAffirmServices').initService('affirm.void');
                affirmService.URL = affirmData.getURLPath() + '/v1/transactions/' + chargeId + '/void';
                var response = affirmService.call().object;
                return response;
            } catch (e) {
                logger.error('Affirm. File - affirmAPI. Error - {0}', e);
                return {
                    error : false
                };
            }
        };
        /**
         * Refund charge by charge ID
         *
         * @param {string} chargeId charge id
         * @returns {Object} charge refund event object
         */
        self.refund = function (chargeId, amount) {
            try {
                var affirmService = require('*/cartridge/scripts/init/initAffirmServices').initService('affirm.refund');
                affirmService.URL = affirmData.getURLPath() + '/v1/transactions/' + chargeId + '/refund';
                var data = amount ? { 'amount': amount } : null;
                var response = affirmService.call(data).object;
                return response;
            } catch (e) {
                logger.error('Affirm. File - affirmAPI. Error - {0}', e);
                return { error : false }
            }
        };
        /**
         * Update order by charge ID
         *
         * @param {string} chargeId charge id
         * @param {Object} updateData update payload
         * @returns {Object} charge update event object
         */
        self.update = function (chargeId, updateData) {
            try {
                var affirmService = require('*/cartridge/scripts/init/initAffirmServices').initService('affirm.update');
                affirmService.URL = affirmData.getURLPath() + '/v1/transactions/' + chargeId + '/update';
                var response = affirmService.call(updateData).object;
                return response;
            } catch (e) {
                logger.error('Affirm. File - affirmAPI. Error - {0}', e);
                return {
                    error : false
                };
            }
        };

        /**
         * Read transaction details
         *
         * @param {string} transactionID transaction id
         * @returns {Object} details of a transaction
         */
        self.read = function (transactionID) {
            try {
                var affirmService = require('*/cartridge/scripts/init/initAffirmServices').initService('affirm.read');
                affirmService.URL = affirmData.getURLPath() + '/v1/transactions/' + transactionID + '?expand=events';
                var data = { 'reqMethod': 'GET' }
                var response = affirmService.call(data).object;
                return response;
            } catch (e) {
                logger.error('Affirm. File - affirmAPI. Error - {0}', e);
                return {
                    error : false
                };
            }
        };
    };
    module.exports = new Api();
}());
