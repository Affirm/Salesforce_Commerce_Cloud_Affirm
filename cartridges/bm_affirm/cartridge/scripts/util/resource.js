/**
 * Resource helper
 *
 */
function ResourceHelper() {}

/**
 * Get the client-side resources of a given page
 * @returns {Object} An objects key key-value pairs holding the resources
 */
ResourceHelper.getResources = function () {
    var Resource = require('dw/web/Resource');

    // application resources
    var resources = {

        // Transaction operation messages
        SHOW_ACTIONS: Resource.msg('operations.show.actions', 'affirm', null),
        HIDE_ACTIONS: Resource.msg('operations.hide.actions', 'affirm', null),
        CHOOSE_ACTIONS: Resource.msg('operations.actions', 'affirm', null),
        TRANSACTION_SUCCESS: Resource.msg('transaction.success', 'affirm', null),
        TRANSACTION_FAILED: Resource.msg('transaction.failed', 'affirm', null),
        TRANSACTION_PROCESSING: Resource.msg('operations.wait', 'affirm', null),
        INVALID_CAPTURE_AMOUNT: Resource.msg('capture.amount.validation', 'affirm', null),
        INVALID_REFUND_AMOUNT: Resource.msg('refund.amount.validation', 'affirm', null),
        MAXIMUM_REFUND_AMOUNT: Resource.msg('maximum.refund.amount', 'affirm', null),
        MAXIMUM_CAPTURE_AMOUNT: Resource.msg('maximum.capture.amount', 'affirm', null)

    };
    return resources;
};

/**
 * Get the client-side URLs of a given page
 * @returns {Object} An objects key key-value pairs holding the URLs
 */
ResourceHelper.getUrls = function () {
    var URLUtils = require('dw/web/URLUtils');

    // application urls
    var urls = {
        operationActions: URLUtils.url('Operations-Action').toString()
    };
    return urls;
};

module.exports = ResourceHelper;
