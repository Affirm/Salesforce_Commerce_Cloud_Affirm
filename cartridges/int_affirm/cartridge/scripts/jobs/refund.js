'use strict';

var Status = require('dw/system/Status');

/**
 * @returns {dw.system.Status} result status 
 */
function execute() {
    try {
 		require('*/cartridge/scripts/affirm').order.refundOrders();
        return new Status(Status.OK);
    } catch (e) {
        return new Status(Status.ERROR);
    }
}

exports.execute = execute;
