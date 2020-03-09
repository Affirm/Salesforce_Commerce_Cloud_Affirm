
/** 
 * Prepare data for rendering button
 * @input CurrentRequest : dw.system.Request
 * 
 * @output checkoutItemObject : Object
 * @output httpProtocol : String
 * @output version : String
 * @output isCartResetNeeded : Boolean
 * @output paymentLimits : Object
*/


/**
 * 
 * @param {Object} pdict pdict values
 * @returns {Object} pipelet
 */
function execute( pdict ) {
    var affirm = require('*/cartridge/scripts/affirm');

    var httpParameterMap = pdict.CurrentHttpParameterMap;
    var request = pdict.CurrentRequest;
    
    if (!affirm.data.getAffirmExpressCheckoutStatus()) { return;}
    var productId = httpParameterMap.productId.value || false;
    // if express checkout started for specific product ID (e.g. from PDP), existing cart needs to be cleaned up beforehand
    var isCartResetNeeded = productId !== false;
    var currencyCode = session.currency.currencyCode;
    var checkoutItemObject = affirm.utils.getCheckoutItemsObject(productId, currencyCode);

    // write pipeline dictionary output parameter
    pdict.checkoutItemObject = checkoutItemObject;
    pdict.httpProtocol = request.getHttpProtocol();
    pdict.version = 'pipelines';
    pdict.isCartResetNeeded = isCartResetNeeded;
    pdict.paymentLimits = {
        min: affirm.data.getAffirmPaymentMinTotal(),
        max: affirm.data.getAffirmPaymentMaxTotal()
    };

    // args.ExampleOut = "A string from Javascript: " + args.ExampleIn + lib.render();

    return PIPELET_NEXT;
}
