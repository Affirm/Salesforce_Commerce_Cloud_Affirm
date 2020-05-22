var Resource = function () {};

Resource.msg = function (string) { return string; };
Resource.msgf = function (string, ignored, ignored2, string2) {
    return string + string2;
};

module.exports = Resource;
