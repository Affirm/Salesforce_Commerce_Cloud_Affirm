(function () {
    /**
     * Library for providing access to DW site preferences and resources
     *
     * @constructor
     * @this {Data}
     */
    var Data = function () {
        var web = require('dw/web');
        var currentSite = require('dw/system/Site').getCurrent();
        var mode = !empty(currentSite.getCustomPreferenceValue('AffirmMode')) ?
            currentSite.getCustomPreferenceValue('AffirmMode').getValue() :
            'sandbox';

        /**
         * Return Affirm public key
         *
         * @returns {string} public key
         */
        this.getPublicKey = function () {
            return currentSite.getCustomPreferenceValue('AffirmPublicKey');
        };
        /**
         * Return Affirm private key
         *
         * @returns {string} private key
         */
        this.getPrivateKey = function () {
            return currentSite.getCustomPreferenceValue('AffirmPrivateKey');
        };
        /**
         * Return Affirm Online Status preference
         *
         * @returns {boolean} Promo text
         */
        this.getAffirmOnlineStatus = function () {
            return !empty(currentSite.getCustomPreferenceValue('AffirmOnline')) ?
                currentSite.getCustomPreferenceValue('AffirmOnline') :
                false;
        };
        this.getCountryCode = function () {
            return !empty(currentSite.getCustomPreferenceValue('AffirmPaymentCountryCode')) ?
                currentSite.getCustomPreferenceValue('AffirmPaymentCountryCode') :
                'USA';
        };
        /**
         * Return Affirm Analytics Status preference only true when mode is production
         *
         * @returns {boolean} status
         */
        this.getAnalyticsStatus = function () {
            return (this.getAffirmOnlineStatus()
                && currentSite.getCustomPreferenceValue('AffirmAnalytics')
                && mode == 'production'
            );
        };
        /**
         * Return Affirm Payment Action preference
         *
         * @returns {string} Promo text
         */
        this.getAffirmPaymentAction = function () {
            return !empty(currentSite.getCustomPreferenceValue('AffirmPaymentAction')) ?
                currentSite.getCustomPreferenceValue('AffirmPaymentAction').getValue() :
                '';
        };
        /**
         * Return Affirm URL path from resource file
         *
         * @returns {string} URL path
         */
        this.getURLPath = function () {
            return web.Resource.msg('affirm.' + mode + '.url', 'affirm', null);
        };

        this.getBaseURL = function() {
        	return web.Resource.msg('affirm.' + mode + '.baseurl', 'affirm', null);
        };
        /**
         * Return Affirm JS path from resource file
         *
         * @returns {string} JS path
         */
        this.getJSPath = function () {
            return web.Resource.msg('affirm.' + mode + '.js', 'affirm', null);
        };
        /**
         * Return status of promo message on cart page
         *
         * @returns {boolean} cart promo status
         */
        this.getCartPromoMessageStatus = function () {
            return !!currentSite.getCustomPreferenceValue('AffirmCartPromoMessage');
        };
        /**
         * Return status of promo message on PLP pages
         *
         * @returns {boolean} plp promo status
         */
        this.getPLPPromoMessageStatus = function () {
        	return !!currentSite.getCustomPreferenceValue('AffirmPLPPromoMessage');
        };
        /**
         * Return status of promo message on product page
         *
         * @returns {boolean} pdp promo status
         */
        this.getProductPromoMessageStatus = function () {
            return !!currentSite.getCustomPreferenceValue('AffirmProductMessage');
        };
        /**
         * Return status of inline checkout messaging
         *
         * @returns {boolean} inline checkout messaging status
         */
        this.getInlineCheckoutMessagingStatus = function () {
            return !!currentSite.getCustomPreferenceValue('AffirmInlineCheckoutMessaging');
        };
        /**
         * Return in-stock items only preference
         *
         * @returns {boolean} in-stock only preference
         */
        this.getShowInStockOnly = function () {
            return !empty(currentSite.getCustomPreferenceValue('AffirmShowInStockOnly')) 
                ? currentSite.getCustomPreferenceValue('AffirmShowInStockOnly') 
                : false;
        };
        /**
         * Return financing program to cart total mapping
         *
         * @returns {array} array of string
         */
        this.getCartTotalMapping = function () {
            return currentSite.getCustomPreferenceValue('AffirmFPTotalRange');
        };
        /**
         * Return default financing program
         *
         * @returns {string} default financing program
         */
        this.getDefaultFinancingProgram = function () {
            return currentSite.getCustomPreferenceValue('AffirmDefaultFP');
        };
        /**
         * Return financing program to customer group mapping
         *
         * @returns {array} array of string
         */
        this.getCustomerGroupMapping = function () {
            return currentSite.getCustomPreferenceValue('AffirmFPCustomerGroup');
        };
        /**
		 * @description Due to CyberSource changes payment can be disabled from the BM (Requirement 09.12.2017)
		 * @returns {boolean} status
		 */
        this.getAffirmPaymentOnlineStatus = function () {
            return !this.getAffirmOnlineStatus() || currentSite.getCustomPreferenceValue('AffirmPaymentOnlineStatus');
        };
        /**
         * Return financing program to date mapping
         *
         * @returns {array} array of string
         */
        this.getDateRangeMapping = function () {
            return currentSite.getCustomPreferenceValue('AffirmFPDateRange');
        };
        /**
         * Return affirm VCN status
         *
         * @returns {string} status on|off
         */
        this.getAffirmVCNStatus = function () {
            return currentSite.getCustomPreferenceValue('AffirmVCNIntegration');
        };
        /**
         * Return affirm minimal applying total
         *
         * @returns {number} minimal applying total
         */
        this.getAffirmMinTotal = function () {
            return currentSite.getCustomPreferenceValue('AffirmMinTotal');
        };
        /**
         * Return affirm minimal applying total
         *
         * @returns {number} minimal applying total
         */
        this.getAffirmPaymentMinTotal = function () {
            return currentSite.getCustomPreferenceValue('AffirmPaymentMinTotal');
        };
        /**
         * Return affirm maximal applying total
         *
         * @returns {number} maximal applying total
         */
        this.getAffirmPaymentMaxTotal = function () {
            return currentSite.getCustomPreferenceValue('AffirmPaymentMaxTotal');
        };
        this.getErrorMessages = function () {
            return JSON.stringify({
                closed: web.Resource.msg('affirm.error.closed', 'affirm', ''),
                default: web.Resource.msg('affirm.error.default', 'affirm', '')
            });
        };
        this.VCNPaymentInstrument = function () {
            return currentSite.getCustomPreferenceValue('AffirmVCNPaymentInstrument');
        };
    };
    module.exports = new Data();
}());
