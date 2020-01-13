/**
*  Replaces affirm payment method in basket by vcn
* 	@input CurrentRequest : dw.system.Request
*   
*   @output obj : Object
*
*/





function execute( pdict ) {

    var helper = require('*/cartridge/scripts/affirm/checkoutNowHelper');

    var request = pdict.CurrentRequest;
    var httpParameterMap = pdict.CurrentHttpParameterMap;

    var result = helper.Update();
    pdict.obj = result.body;

    return PIPELET_NEXT;

   

}

