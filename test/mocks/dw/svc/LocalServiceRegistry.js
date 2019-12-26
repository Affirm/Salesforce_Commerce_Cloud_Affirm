var LocalServiceRegistry = function () {};

LocalServiceRegistry.createService = function (name, obj) {
    return function () {
        obj.name = name;
        Object.assign(obj, this);
        this.object = obj;
        return this;
    };
};
module.exports = LocalServiceRegistry;
