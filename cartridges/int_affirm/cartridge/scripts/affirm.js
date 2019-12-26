/**
 *  Just assemble Affirm libraries into one
 *
 */
(function () {
    module.exports = {
        basket: require('./basket/affirmBasket'),
        data: require('./data/affirmData'),
        order: require('./order/affirmOrder'),
        utils: require('./utils/affirmUtils')
    };
}());
