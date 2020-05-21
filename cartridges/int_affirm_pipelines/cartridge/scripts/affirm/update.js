/**
* Demandware Script File
*
*/
var AFFIRM_PAYMENT_METHOD = 'Affirm';
var BasketMgr = require('dw/order/BasketMgr');
var CSRFProtection = require('dw/web/CSRFProtection');
var affirm = require('*/cartridge/scripts/affirm');
var CSRFProtection = require('dw/web/CSRFProtection');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Transaction = require('dw/system/Transaction');

/**
 * @returns {pipelet} status
 */
function execute(){
    if (!CSRFProtection.validateRequest()){
        return PIPELET_ERROR;
    }
    var hookName = "dw.int_affirm.payment_instrument." + affirm.data.VCNPaymentInstrument();
    var basket = BasketMgr.getCurrentBasket();
    var paymentInstruments = basket.getPaymentInstruments(AFFIRM_PAYMENT_METHOD);
    if(paymentInstruments == null && !paymentInstruments[0]){
        return PIPELET_ERROR;
    }
    var paymentInstrument = paymentInstruments[0];
    Transaction.wrap(function(){
        basket.removePaymentInstrument(paymentInstrument);
    });
    if (dw.system.HookMgr.hasHook(hookName)){
        var paymentInstrument = dw.system.HookMgr.callHook(hookName, "add", basket);
        if (!paymentInstrument){
            return PIPELET_ERROR;
        } 
        Transaction.wrap(function(){
            paymentInstrument.custom.affirmed = true;
        });
		
    } else {
        return PIPELET_ERROR;
    }
	
    return PIPELET_NEXT;
}
