/**
 * This script used for init and configure Affirm services
 * @param {dw.system.Site} currentSite current site
 * @returns {string} authentication string
 */
var getAuthHeader = function (currentSite) {
    var authString = currentSite.getCustomPreferenceValue('AffirmPublicKey')
            + ':' + currentSite.getCustomPreferenceValue('AffirmPrivateKey');
    return 'Basic ' + require('dw/util/StringUtils').encodeBase64(authString);
};

/**
 * @returns {string} randomly unique string for idempotency key
 */
 function getIdempotencyKey() {
    var _uuid = dw.util.UUIDUtils.createUUID();
    return _uuid;
}

var commonCreateRequest = function (svc, args) {
    if (args && args.reqMethod !== undefined) {
        svc.setRequestMethod(args.reqMethod)
    } else {
        svc.setRequestMethod('POST');
    }
    svc.addHeader('Content-Type', 'application/json');
    svc.addHeader('Authorization', getAuthHeader(require('dw/system/Site').current));
    svc.addHeader('Idempotency-Key', getIdempotencyKey());

    var affirmData = require('*/cartridge/scripts/data/affirmData');
    var country_code = affirmData.getCountryCode();
    if (country_code && country_code !== undefined) {
        svc.addHeader('Country-Code', country_code);
    }
    if (!empty(args)) {
        return JSON.stringify(args);
    }
};

/**
 *
 * @param {string} serviceName service name
 * @returns {Object} service
 */
function initService(serviceName) {
    var service = require('dw/svc/LocalServiceRegistry').createService(serviceName, {
    	createRequest: commonCreateRequest,
    	parseResponse: require('*/cartridge/scripts/utils/jobUtils').responseParser,
        filterLogMessage: function (msg) {
            return msg;
        }
    });
    return service;
}

module.exports.initService = initService;

