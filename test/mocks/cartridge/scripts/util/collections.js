/**
 * Map method for dw.util.Collection subclass instance
 * @param {dw.util.Collection} collection - Collection subclass instance to map over
 * @param {Function} callback - Callback function for each item
 * @param {Object} [scope] - Optional execution scope to pass to callback
 * @returns {Array} Array of results of map
 */
function map(collection, callback, scope) {
    var iterator = Object.hasOwnProperty.call(collection, 'iterator')
        ? collection.iterator()
        : collection;
    var index = 0;
    var item = null;
    var result = [];
    while (iterator.hasNext()) {
        item = iterator.next();
        result.push(scope ? callback.call(scope, item, index, collection)
            : callback(item, index, collection));
        index++;
    }
    return result;
}


module.exports = {
    map: map
};
