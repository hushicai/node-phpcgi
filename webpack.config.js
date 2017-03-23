const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  context: __dirname,
  target: 'node',
  entry: {
    koa: './middlewares/koa.js'
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js',
    libraryTarget: "commonjs2"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  externals: [nodeExternals()],
  node: {
    __dirname: true,
    __filename: true
  },
};
