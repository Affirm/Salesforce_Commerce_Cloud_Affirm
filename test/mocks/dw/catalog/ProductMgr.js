/**
 * Represents dw.catalog.ProductMgr
 */

var Product = require('./Product');
var ProductMgr = function () {};

// variables required for specific method testing
var products = ['P123456', 'pd65432', '111111'];

ProductMgr.getProduct = function (productID) {
    for (var x = 0; x < products.length; x++) {
        if (productID === products[x]) return new Product(productID, 100);
    }
    return null;
}; // Product
ProductMgr.queryAllSiteProducts = function () {}; // SeekableIterator
ProductMgr.queryAllSiteProductsSorted = function () {}; // SeekableIterator
ProductMgr.queryProductsInCatalog = function (catalog) {}; // SeekableIterator
ProductMgr.queryProductsInCatalogSorted = function (catalog) {}; // SeekableIterator

module.exports = ProductMgr;
