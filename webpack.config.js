const path = require('path');
// const webpack = require('webpack');
const BabiliPlugin = require('babili-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = (options) => {
  const plugins = [
    new ManifestPlugin({
      fileName: path.join('..', '_data', 'manifest.json'),
    }),
  ];
  if (!options.dev) {
    plugins.push(
      new BabiliPlugin()
    );
  }
  return {
    devServer: {
      contentBase: path.join(__dirname, '_site'),
      clientLogLevel: 'none',
      compress: true,
      port: 4000,
    },
    devtool: options.dev ? 'cheap-module-eval-source-map' : 'hidden-source-map',
    entry: {
      bundle: './js/main.js',
    },
    output: {
      path: path.join(__dirname, 'assets'),
      publicPath: 'assets/',
      filename: '[name].[chunkhash].js',
    },
    performance: {
      hints: false,
    },
    plugins,
  };
};