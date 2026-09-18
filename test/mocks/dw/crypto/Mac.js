var crypto = require('crypto');

function Mac(algorithm) {
    this.algorithm = algorithm;
}

Mac.HMAC_SHA_512 = 'HmacSHA512';

Mac.prototype.digest = function (message, key) {
    return crypto.createHmac('sha512', key).update(message).digest();
};

module.exports = Mac;
