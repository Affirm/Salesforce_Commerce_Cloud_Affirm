/**

*  Handles successful affirm response
* 	@input CurrentRequest : dw.system.Request
*   
*   @output order : Object
*	@output success : Boolean
*/





function execute( pdict ) {

    var helper = require('*/cartridge/scripts/affirm/checkoutNowHelper');
    
    var request = pdict.CurrentRequest;
    var httpParameterMap = pdict.CurrentHttpParameterMap;
    
    var result = helper.Confirmation();
    pdict.order = result.body;
    pdict.success = result.success;

    return PIPELET_NEXT;

}

