/**
* Represents dw.util.Map
*/

var DwMap = function () {};

var storage = new Map();

DwMap.prototype.empty = storage.size === 0; // boolean
DwMap.EMPTY_MAP = new DwMap(); // Map
DwMap.prototype.length = storage.size; // Number


DwMap.prototype.clear = function () { storage.clear(); }; //  void
DwMap.prototype.containsKey = function (key) { return storage.has(key); }; //  boolean
DwMap.prototype.containsValue = function (value) {}; //  boolean
DwMap.prototype.entrySet = function () {}; //  Set
DwMap.prototype.get = function (key) { return storage.get(key); }; //  Object
DwMap.prototype.getLength = function () { return storage.size; }; //  Number
DwMap.prototype.isEmpty = function () { return storage.size === 0; }; //  boolean
DwMap.prototype.keySet = function () {
    var result = [];
    var i = 0;
    var keysIterator = storage.keys();
    var key = keysIterator.next();
    while (!key.done) {
        result[i++] = key.value;
        key = keysIterator.next();
    }
    return result;
}; //  Set
DwMap.prototype.put = function (key, value) {
    storage.set(key, value);
    return this;
}; //  Object
DwMap.prototype.putAll = function (other) {
    if (!(other instanceof DwMap)) {
        throw new Error('Map mock putAll method supports only Map objects as parameter');
    }
    var keysIterator = storage.keys();
    var key = keysIterator.next();
    while (!key.done) {
        storage.set(key.value, other.get(key.vale));
        key = keysIterator.next();
    }
}; //  void
DwMap.prototype.remove = function (key) {}; //  Object
DwMap.prototype.size = function () { return storage.size; }; //  Number
DwMap.prototype.values = function () {}; //  Collection

module.exports = DwMap;
