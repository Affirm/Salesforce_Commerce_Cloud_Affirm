/* globals cat, cd, cp, echo, exec, exit, find, ls, mkdir, rm, target, test */
'use strict';

require('shelljs/make');
var path = require('path');

var createJSPath = function() {
  var result = {};
  var jsFiles = ls('./tmp/js/*.js');

  jsFiles.forEach(function(filePath) {
    var name = path.basename(filePath, '.js');
    result[name] = filePath;
  });
  return result;
};

module.exports = [{
  name: 'js',
  entry: createJSPath(),
  output: {
    path: path.resolve('./cartridges/int_affirm_overlay/cartridge/static/default/js/'),
    filename: '[name].js'
  }
}];