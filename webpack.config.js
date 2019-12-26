'use strict';

var path = require('path');
var globEntries = require('webpack-glob-entries');
var packageJson = require('./package.json');
var cwd = process.cwd();

const typeMapping = {
    js: '/cartridge/client/default/js',
    scss: '/cartridge/client/default/scss'
};

/**
 * @param {Object} data aliases
 * @returns {Object} combined aliases
 */
function getAliases(data) {
    var cartridgeAliases = {};
    Object.keys(packageJson.paths || {}).map((key) => {
        cartridgeAliases[key] = path.join(cwd, packageJson.paths[key], typeMapping[data.type]);
    });
    var aliases = data.alias || {};
    Object.keys(aliases).forEach(key => {
        aliases[key] = path.join(cwd, aliases[key]);
    });
    return Object.assign({}, cartridgeAliases, aliases);
}

/**
 * @param {Object} data config data
 * @param {Object} env environment
 * @returns {Object} configuration Object
 */
function getConfig(data, env = {}) {
    var name = data.type || 'default';
    var entryPath = path.resolve('cartridges', data.cartridge, 'cartridge', data.src, data.entry);
    var includePaths = data.includePaths || [];
    var aliases = getAliases(data);
    const isProduction = env && env.production || false;

    return {
        name: name,
        mode: isProduction ? 'production' : 'development',
        devtool: 'source-map',
        optimization: {
            minimize: isProduction
        },
        entry: globEntries(entryPath),
        output: {
            path: path.resolve('cartridges', data.cartridge, 'cartridge', data.dest),
            filename: '[name].js',
            chunkFilename: '[name].bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                }
            ]
        },
        resolve: {
            alias: aliases
        }
    };
}

/**
 * @param {Object} env environment
 * @returns {Array} configurations
 */
function generateConfig(env) {
    var configs = packageJson.config.webpack || [];
    return configs.map((data) => {
        return getConfig(data, env);
    });
}

module.exports = generateConfig();6