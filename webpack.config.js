var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: "./src/scribe-plugin-table-command.js",
  output: {
    path: "dist",
    filename: "scribe-plugin-table-command.js",
    libraryTarget: "umd"
  },
  module: {
    loaders: [{
      test: /\.styl$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader!stylus-loader')
    }]
  },
  plugins: [
    new ExtractTextPlugin('scribe-plugin-table-command.css')
  ]
};
