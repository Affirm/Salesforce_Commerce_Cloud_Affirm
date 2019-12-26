/**
 *  Just assemble Affirm libraries into one
 *
 */

(function () {
    module.exports = {
        basket: require('*/cartridge/scripts/basket/affirmBasket'),
        data: require('*/cartridge/scripts/data/affirmData'),
        order: require('*/cartridge/scripts/order/affirmOrder'),
        utils: require('*/cartridge/scripts/utils/affirmUtils')
    };
}());
