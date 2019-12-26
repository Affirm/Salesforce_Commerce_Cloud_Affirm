'use strict';

var Status = require('dw/system/Status');

/**
 * @returns {dw.system.Status} result status 
 */
function execute() {
    try {
        var affirm = require('*/cartridge/scripts/affirm');
        affirm.order.captureOrders();
        affirm.order.voidOrders();
        affirm.order.refundOrders();
        return new Status(Status.OK);
    } catch (e) {
        return new Status(Status.ERROR);
    }
}

exports.execute = execute;
