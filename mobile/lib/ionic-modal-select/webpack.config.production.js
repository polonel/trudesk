var webpack = require("webpack");

module.exports = {
  devtool: 'sourcemap',
  output: {
    filename: 'ionic-modal-select.min.js'
  },
  plugins : [
    new webpack.optimize.UglifyJsPlugin({ minimize: true })
  ],
  module: {
    loaders: [
       { test: /\.js$/, exclude: [/app\/lib/, /node_modules/], loader: 'ng-annotate!babel' },
    ],

  }
};
