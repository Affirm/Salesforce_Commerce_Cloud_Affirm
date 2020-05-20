/**
* Adds items to basket, calculates costs and returns possible shipping options:
*
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
	
    var result = helper.CreateOrder();

    pdict.obj = result.body;
	
    return PIPELET_NEXT;
   
}
