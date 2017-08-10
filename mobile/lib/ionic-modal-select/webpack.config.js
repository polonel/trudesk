var webpack = require("webpack");

module.exports = {
  devtool: 'sourcemap',
  output: {
    filename: 'ionic-modal-select.js'
  },
  plugins : [
    
  ],
  module: {
    loaders: [
       { test: /\.js$/, exclude: [/app\/lib/, /node_modules/], loader: 'ng-annotate!babel' },

    ],

  }
};
