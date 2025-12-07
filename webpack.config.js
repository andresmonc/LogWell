const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESMResolverPlugin = require('./webpack-esm-resolver');

module.exports = {
  entry: './index.web.js',
  mode: process.env.NODE_ENV || 'development',
  output: {
    path: path.resolve(__dirname, 'web-build'),
    filename: 'bundle.js',
    publicPath: '/',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-gesture-handler$': 'react-native-web',
      'react-native-vector-icons/MaterialIcons': '@expo/vector-icons/MaterialIcons',
      'react-native-vector-icons/MaterialCommunityIcons': '@expo/vector-icons/MaterialCommunityIcons',
      '@react-native-vector-icons/material-design-icons': '@expo/vector-icons/MaterialCommunityIcons',
      'expo-font': path.resolve(__dirname, 'src/utils/expo-font-mock.js'),
    },
    fullySpecified: false, // Allow imports without file extensions for ESM modules
  },
  node: {
    global: true,
    __dirname: false,
    __filename: false,
  },
  experiments: {
    topLevelAwait: true,
  },
  module: {
    rules: [
      {
        // Special rule for useFrameSize.js to transform require() calls
        // Loaders run from right to left, so we need require-loader first
        test: /useFrameSize\.js$/,
        include: /node_modules\/@react-navigation\/elements/,
        use: [
          {
            loader: path.resolve(__dirname, 'webpack-require-loader.js'),
          },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              configFile: path.resolve(__dirname, 'babel.config.web.js'),
            },
          },
        ],
      },
      {
        test: /\.(ts|tsx|js|jsx|mjs)$/,
        exclude: /node_modules\/(?!(react-native|@react-native|react-native-web|@expo|react-native-image-picker|react-native-vector-icons|@react-navigation|@react-native-async-storage|react-native-paper|react-native-safe-area-context)\/).*/,
        resolve: {
          fullySpecified: false,
        },
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            configFile: path.resolve(__dirname, 'babel.config.web.js'),
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/sw.js', to: 'sw.js' },
        // Icons will be added when created
        // { from: 'public/icon-192.png', to: 'icon-192.png' },
        // { from: 'public/icon-512.png', to: 'icon-512.png' },
      ],
    }),
    new ESMResolverPlugin(),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production'),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    historyApiFallback: true,
    hot: true,
  },
  devtool: 'source-map',
};

