const webpack = require('webpack');
const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add NodePolyfillPlugin to handle node: protocol imports
      webpackConfig.plugins.push(new NodePolyfillPlugin());

      // Handle node: protocol imports
      webpackConfig.resolve.fallback = {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        url: require.resolve('url/'),
        os: require.resolve('os-browserify/browser'),
        constants: require.resolve('constants-browserify'),
        timers: require.resolve('timers-browserify'),
        path: require.resolve('path-browserify'),
        fs: false,
        net: false,
        tls: false,
        dns: false,
        dgram: false,
        http: false,
        https: false,
        zlib: false,
        child_process: false,
        events: require.resolve('events/'),
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
        process: false,
        vm: false,
      };

      // Add plugins to provide global polyfills
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: require.resolve('process/browser'),
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // Fix for ESM modules
      webpackConfig.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      });

      // Add resolver for node: protocol
      webpackConfig.module.rules.unshift({
        test: /\.js$/,
        resolve: {
          alias: {
            'node:events': 'events',
            'node:stream': 'stream-browserify',
            'node:url': 'url',
          },
        },
      });

      return webpackConfig;
    },
  },
}; 