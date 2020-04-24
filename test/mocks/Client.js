var Client = function (statusCode) {
    this.statusCode = statusCode;
    this.text = JSON.stringify({ content: 'test content' });
};

module.exports = Client;
