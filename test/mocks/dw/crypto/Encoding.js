var Encoding = {};

Encoding.toHex = function (bytes) {
    return Buffer.isBuffer(bytes) ? bytes.toString('hex') : String(bytes);
};

module.exports = Encoding;
