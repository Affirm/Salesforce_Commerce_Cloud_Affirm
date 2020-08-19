/**
 *  Just assemble Affirm libraries into one
 *
 */
(function () {
    module.exports = {
        data: require('./data/affirmData'),
        utils: require('./utils/affirmUtils')
    };
}());
