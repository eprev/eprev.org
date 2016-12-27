const path = require('path');
const fs = require('fs');
const BabiliPlugin = require('babili-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = (options) => {
  const plugins = [
  ];
  const manifestFileName = path.join('_data', 'manifest.json');
  if (options.build) {
    plugins.push(
      new ManifestPlugin({
        fileName: path.join('..', manifestFileName),
      }),
      new BabiliPlugin()
    );
  }
  if (!options.build) {
    try {
        fs.unlinkSync(manifestFileName);
    } catch (e) {}
  }
  return {
    devServer: {
      contentBase: path.join(__dirname, '_site'),
      // host: '192.168.1.100',
      clientLogLevel: 'none',
      compress: true,
      port: 4000,
    },
    devtool: options.build ? 'hidden-source-map' : 'cheap-source-map',
    entry: {
      bundle: './js/main.js',
    },
    output: {
      path: path.join(__dirname, 'assets'),
      publicPath: 'assets/',
      filename: options.build ? '[name].[chunkhash].js' : '[name].js',
    },
    performance: {
      hints: false,
    },
    plugins,
  };
};