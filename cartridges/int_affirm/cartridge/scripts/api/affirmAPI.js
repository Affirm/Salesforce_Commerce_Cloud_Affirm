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
                affirmService.URL = affirmData.getURLPath() + 'charges';
                return affirmService.call({
                    'checkout_token': token
                }).object;
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
        self.capture = function (chargeId, captureData) {
            try {
                var affirmService = require('*/cartridge/scripts/init/initAffirmServices').initService('affirm.capture');
                affirmService.URL = affirmData.getURLPath() + 'charges/' + chargeId + '/capture';
                return affirmService.call({
                    'order_id' : captureData
                }).object;
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
                affirmService.URL = affirmData.getURLPath() + 'charges/' + chargeId + '/void';
                return affirmService.call().object;
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
        self.refund = function (chargeId) {
            try {
                var affirmService = require('*/cartridge/scripts/init/initAffirmServices').initService('affirm.refund');
                    
                affirmService.URL = affirmData.getURLPath() + 'charges/' + chargeId + '/refund';
                
                return affirmService.call().object;
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
                affirmService.URL = affirmData.getURLPath() + 'charges/' + chargeId + '/update';
                return affirmService.call(updateData).object;
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
