var URLUtils = function () {};

URLUtils.http = function () {};
URLUtils.https = function (api, paramName, paramValue) {
    return 'https://mywebsite/' + this.abs.apply(null, arguments);
};
URLUtils.abs = function (api, paramName, paramValue) {
    var result = api;
    if (paramName) {
        result += '?';
    }
    for (var i = 1; i < arguments.length; i += 2) {
        result += arguments[i] + '=';
        result += !arguments[i + 1] ? '' : arguments[i + 1];
        result += i + 2 < arguments.length ? '&' : '';
    }
    return result;
};
URLUtils.url = function () {};
URLUtils.home = function () {};
URLUtils.webRoot = function () {};
URLUtils.absWebRoot = function () {};
URLUtils.httpWebRoot = function () {};
URLUtils.httpsWebRoot = function () {};
URLUtils.httpContinue = function () {};
URLUtils.httpsContinue = function () {};

URLUtils.staticURL = function () {
    return '/on/demandware.static/relative/url/to/resource';
};

URLUtils.imageURL = function () {};
URLUtils.absImage = function () {};

URLUtils.httpStatic = function () {
    return 'http://domain/on/demandware.static/absolute/http/url/to/resource';
};

URLUtils.httpsStatic = function () {
    return 'https://domain/on/demandware.static/absolute/https/url/to/resource';
};

URLUtils.httpsImage = function () {};
URLUtils.httpImage = function () {};

URLUtils.absStatic = function () {
    return 'http://domain/on/demandware.static/absolute/url/to/resource';
};

URLUtils.sessionRedirect = function () {};
URLUtils.sessionRedirectHttpOnly = function () {};
URLUtils.continueURL = function () {};
URLUtils.httpHome = function () {};
URLUtils.httpsHome = function () {};

module.exports = URLUtils;
