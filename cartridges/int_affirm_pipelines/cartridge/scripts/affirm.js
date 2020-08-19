/**
 *  Just assemble Affirm libraries into one
 *
 */

(function () {
    module.exports = {
        data: require('*/cartridge/scripts/data/affirmData'),
        utils: require('*/cartridge/scripts/utils/affirmUtils')
    };
}());
