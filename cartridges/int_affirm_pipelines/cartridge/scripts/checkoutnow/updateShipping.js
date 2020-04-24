/**
*  Updates current basket shipping data based on Affirm request
* 	@input CurrentRequest : dw.system.Request
*   
*   @output obj : Object
*
*/




/**
 * 
 * @param {Object} pdict pdict values
 * @returns {Object} pipelet
 */
function execute( pdict ) {

    var helper = require('*/cartridge/scripts/affirm/checkoutNowHelper');

    var request = pdict.CurrentRequest;
    var httpParameterMap = pdict.CurrentHttpParameterMap;

    var result = helper.UpdateShipping();
    pdict.obj = result.body;

    return PIPELET_NEXT;

   

}

