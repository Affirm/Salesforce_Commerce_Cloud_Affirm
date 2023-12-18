/**
 * Send an error back to Affirm to be tracked and monitored
 */
const INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";
const INVALID_AMOUNT = "INVALID_AMOUNT";
const TRANSACTION_DECLINED = "TRANSACTION_DECLINED";

const MAX_STACK_FRAMES = 10;


/**
 * Set the headers
 * @param {dw.net.HTTPClient} req the current request
 * @param {dw.system.Site} currentSite current site
 */
function setHeaders(req, currentSite) {
    var authString = currentSite.getCustomPreferenceValue('AffirmPublicKey')
            + ':' + currentSite.getCustomPreferenceValue('AffirmPrivateKey');

    req.setRequestHeader('Authorization', 'Basic ' + require('dw/util/StringUtils').encodeBase64(authString));
    req.setRequestHeader('Content-Type', 'application/json');
};

/**
 * Track an error without a stack trace
 * @param {String} transaction_step The transaction step the error occurred on
 * @param {String} message The error message
 * @param {String} error_type The error type
 */
function trackErrorWithoutStack (transaction_step, message, error_type) {
    error_data = {
        "error_type": error_type,
        "error_message": message
    };

    trackError(transaction_step, error_data);
}

/**
 * Track an uncaught error with a stack trace
 * @param {String} transaction_step The transaction step the error occurred on
 * @param {Object} error The error that occurred
 */
function trackErrorWithStack (transaction_step, error) {
    error_data = {
        "error_type": INTERNAL_SERVER_ERROR,
        "error_message": error.message,
        "error_class": error.name,
        "trace": formatStackTraces(error)
    };

    trackError(transaction_step, error_data);
}

/**
 * Creating POST request with the error information
 * @param {String} transaction_step The transaction step the error occurred on
 * @param {Object} error_data Information about the error
 */
function trackError (transaction_step, error_data) {
    try {
        var url = require('*/cartridge/scripts/data/affirmData').getURLPath() 
                    + '/v1/partnersolutions/platform/tracker';

        var HTTPClient = require('dw/net/HTTPClient');
        var req = new HTTPClient();
        var currentSite = require('dw/system/Site').current;
        req.open('POST', url);
        req.setTimeout(100);
        setHeaders(req, currentSite);

        req.send(JSON.stringify({
            "extension_data": 
                {
                    "platform": "sfcc",
                    "environment": currentSite.getCustomPreferenceValue('AffirmMode') == 'sandbox' ?
                                    'sandbox' : 'live',
                    "language": "java",
                    "code_version": "",
                    "extension_version": require('dw/web').Resource.msg('metadata.platform_affirm', 'affirm', null),
                    "platform_version": require('*/cartridge/scripts/utils/affirmUtils').getPlatformVersion(),
                },    
            "transaction_step": transaction_step,
            "error_data": error_data
        }));
    } finally {
        // Do nothing if it fails because we don't want this to be a blocker
        // Most requests will timeout waiting for a response, but we want to fire and forget
        // so as long as Affirm receives our request we are okay
    }
}

/**
 * Set the headers
 * @param {Object} error The error
 */
function formatStackTraces(error) {
    var trace = [];

    var stack = (error.stack).split(/\r?\n/);
    
    // The last element of the array is blank, so we only have length - 1 elements
    for (var i = Math.min(MAX_STACK_FRAMES, stack.length - 1) - 1; i >= 0 ; i--) {
        // Remove the "at " part of the stack trace
        var frame = stack[i].substring(stack[i].indexOf(" ") + 1);
        // Split on the :
        var indexColon = frame.lastIndexOf(":");
        var fileName = frame.substring(0, indexColon);
        var lineNumber = parseInt(frame.substring(indexColon + 1));
        trace.push({
            "filename": fileName,
            "lineno": lineNumber,
            "method": ""
        });
    }

    return trace;
};

module.exports = {
    INTERNAL_SERVER_ERROR: INTERNAL_SERVER_ERROR,
    INVALID_AMOUNT: INVALID_AMOUNT, 
    TRANSACTION_DECLINED: TRANSACTION_DECLINED,
    trackErrorWithoutStack: trackErrorWithoutStack,
    trackErrorWithStack: trackErrorWithStack
}