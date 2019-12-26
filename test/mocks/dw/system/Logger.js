var Logger = function () {};

log = [];

Logger.warn = function () {};
Logger.isInfoEnabled = function () {};
Logger.error = function (msg) {
    this.msg = msg;
};
Logger.debugEnabled = function () {};
Logger.isDebugEnabled = function () {};
Logger.warnEnabled = function () {};
Logger.rootLogger = function () {};
Logger.getLogger = function (name) { this.name = name; return this; };
Logger.debug = function () {};
Logger.info = function () {};
Logger.infoEnabled = function () {};
Logger.isErrorEnabled = function () {};
Logger.isWarnEnabled = function () {};
Logger.errorEnabled = function () {};
Logger.getRootLogger = function () {};
Logger.fatal = function () {};

module.exports = Logger;
