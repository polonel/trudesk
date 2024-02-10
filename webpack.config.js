const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackBar = require('webpackbar')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const IS_PROD = process.env.NODE_ENV === 'production'

module.exports = {
  mode: IS_PROD ? 'production' : 'development',
  target: 'web',
  entry: {
    'js/trudesk': path.resolve(__dirname, 'src/client/app.jsx'),
    'js/install_trudesk': path.resolve(__dirname, 'src/client/containers/Install/install-app.jsx')
  },
  output: {
    filename: '[name].[chunkhash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].bundle.js',
    path: path.resolve(__dirname, 'dist/public/'),
    publicPath: '/'
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src/client/lib/'), 'node_modules'],
    alias: {
      // client side
      handlebars: 'vendor/handlebars/handlebars',
      jquery: 'vendor/jquery/jquery',
      jquery_scrollTo: 'vendor/jquery/jquery.scrollTo.min',
      jscookie: 'vendor/jscookie/js.cookie',
      easing: 'vendor/jquery/jquery.easing',
      moment: 'vendor/moment/moment',
      moment_timezone: 'vendor/moment/moment-timezone-with-data',
      uikit: 'vendor/uikit/js/uikit_combined.min',
      modernizr: 'vendor/modernizr/modernizr',
      underscore: 'vendor/underscore/underscore',

      async: 'vendor/async/async',
      jquery_custom: 'plugins/jquery.custom',
      datatables: 'vendor/datatables/jquery.dataTables',
      dt_responsive: 'vendor/datatables/dataTables.responsive',
      dt_grouping: 'vendor/datatables/dataTables.grouping',
      dt_scroller: 'vendor/datatables/dataTables.scroller',
      dt_ipaddress: 'vendor/datatables/dataTables.ipaddress',
      easypiechart: 'vendor/easypiechart/easypiechart',
      chosen: 'vendor/chosen/chosen.jquery.min',
      autogrow: 'plugins/autogrow',
      pace: 'vendor/pace/pace.min',
      tomarkdown: 'vendor/tomarkdown/tomarkdown',
      colorpicker: 'vendor/simplecolorpicker/jquery.simplecolorpicker',
      datepicker: 'vendor/datepicker/foundation-datepicker',
      d3: 'vendor/d3/d3.min',
      c3: 'vendor/c3/c3',
      metricsgraphics: 'vendor/metricsgraphics/metricsgraphics.min',
      d3pie: 'vendor/d3pie/d3pie.min',
      peity: 'vendor/peity/jquery.peity.min',
      countup: 'vendor/countup/countUp.min',
      velocity: 'vendor/velocity/velocity.min',
      selectize: 'vendor/selectize/selectize',
      multiselect: 'vendor/multiselect/js/jquery.multi-select',
      waves: 'vendor/waves/waves',
      isinview: 'plugins/jquery.isinview',
      jquery_docsize: 'plugins/jquery.documentsize',
      jquery_steps: 'plugins/jquery.steps',
      jquery_actual: 'plugins/jquery.actual',
      formvalidator: 'vendor/formvalidator/jquery.form-validator',
      qrcode: 'vendor/qrcode/jquery.qrcode.min',
      tether: 'vendor/tether/tether.min',
      shepherd: 'vendor/shepherd/js/shepherd.min',
      easymde: 'vendor/easymde/dist/easymde.min',
      inlineAttachment: 'vendor/easymde/dist/inline-attachment',
      inputInlineAttachment: 'vendor/easymde/dist/input.inline-attachment',
      cm4InlineAttachment: 'vendor/easymde/dist/codemirror-4.inline-attachment',
      grapesjs: 'vendor/grapesjs/grapes.min',
      grapesjsEmail: 'vendor/grapesjs/grapesjs-preset-email.min',
      waypoints: 'vendor/waypoints/jquery.waypoints',
      snackbar: 'plugins/snackbar',

      sass: path.resolve(__dirname, 'src/sass'),
      app: path.resolve(__dirname, 'src/client/app'),
      components: path.resolve(__dirname, 'src/client/components'),
      containers: path.resolve(__dirname, 'src/client/containers'),
      actions: path.resolve(__dirname, 'src/client/actions'),
      api: path.resolve(__dirname, 'src/client/api'),
      lib: path.resolve(__dirname, 'src/client/lib'),
      serverSocket: path.resolve(__dirname, 'src/socketio')
    },

    extensions: ['.js', '.jsx', '.ts', 'tsx']
  },
  externals: {
    // These are bunbled already
    jsdom: 'jsdom',
    canvas: 'canvas'
  },
  module: {
    rules: [
      {
        test: /uikit_combined\.min\.js/,
        loader: 'exports-loader',
        options: { type: 'commonjs', exports: 'single UIkit' }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        // exclude: path.resolve(__dirname, 'node_modules'),
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '/'
            }
          },
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(ttf|eot|woff|woff2|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]'
        }
      },
      {
        test: /\.(gif|jpg|jpeg|png)$/,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext][query]'
        }
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/react', '@babel/env'],
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { loose: true }],
              '@babel/plugin-transform-runtime'
            ]
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          format: { comments: false },
          ecma: 6,
          mangle: true
        },
        extractComments: false
      })
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      maxSize: 3000000,
      cacheGroups: {
        reactVendor: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'js/lib/vendor/react.bundle',
          priority: 10
        },
        utilityVendor: {
          test: /[\\/]node_modules[\\/](lodash|moment|moment-timezone)[\\/]/,
          name: 'js/lib/vendor/utility.bundle',
          priority: 10
        },
        libVendor: {
          test: /[\\/]lib[\\/]vendor[\\/]/,
          name: 'js/lib/vendor/vendor.bundle',
          priority: -10,
          enforce: true
        },
        plugins: {
          test: /[\\/]lib[\\/]plugins[\\/]/,
          name: 'js/lib/plugins.bundle',
          priority: -10,
          reuseExistingChunk: true
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'js/lib/vendor/npm.bundle',
          priority: -10,
          reuseExistingChunk: true,
          enforce: true
        },
        jqueryVendor: {
          test: /[\\/]lib[\\/]vendor[\\/]jquery[\\/]/,
          name: 'js/lib/vendor/jquery.bundle',
          priority: 10,
          enforce: true
        },
        uikit: {
          test: /[\\/]lib[\\/]vendor[\\/]uikit[\\/]/,
          name: 'js/lib/vendor/uikit.bundle',
          priority: 10,
          enforce: true
        },
        components: {
          test: /[\\/]components[\\/]/,
          name: 'js/lib/components.bundle',
          priority: 10
        },
        default: {
          minChunks: 1,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: [
    new WebpackBar({ name: 'Frontend' }),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: true,
      cleanOnceBeforeBuildPatterns: ['**/*', '!.gitkeep']
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      Cookies: 'jscookie',
      Tether: 'tether',
      'window.Tether': 'tether',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
      Modernizr: 'modernizr',
      'window.Modernizr': 'modernizr',
      moment: 'moment',
      'window.moment': 'moment',
      setImmediate: 'async'
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/ }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
      // chunkFilename: 'css/[name].[contenthash:8].css'
    }),
    new HtmlWebpackPlugin({
      // inject: true,
      minify: IS_PROD,
      template: path.resolve(__dirname, 'src/client/index.html'),
      filename: '../index.html',
      chunks: ['js/trudesk'],
      chunksSortMode: 'none'
    }),
    new HtmlWebpackPlugin({
      // inject: true,
      minify: IS_PROD,
      template: path.resolve(__dirname, 'src/client/index-install.html'),
      filename: '../index-install.html',
      chunks: ['js/install_trudesk'],
      chunksSortMode: 'none'
    }),
    new CompressionPlugin({
      deleteOriginalAssets: true,
      algorithm: 'gzip',
      test: /\.(js|css)$/
    })
  ],
  performance: {
    hints: 'warning',
    maxEntrypointSize: 400000,
    maxAssetSize: 1000000
  }
}
