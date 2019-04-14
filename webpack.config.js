var path = require('path')
var webpack = require('webpack')
var MiniCssExtractPlugin = require('mini-css-extract-plugin')
var TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  target: 'web',
  entry: {
    vendor: [
      'jquery',
      'jquery_custom',
      'angular',
      'angularRoute',
      'angularCookies',
      'angularSanitize',
      'datatables',
      'dt_responsive',
      'dt_grouping',
      'dt_ipaddress',
      'modernizr',
      'underscore'
    ],
    'trudesk.min': path.resolve(__dirname, 'src/public/js/app.js'),
    truRequire: 'expose-loader?truRequire!' + path.resolve(__dirname, './src/public/js/truRequire')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public/js'),
    publicPath: '/js/'
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src/public/js/'), 'node_modules'],
    alias: {
      // client side
      handlebars: 'vendor/handlebars/handlebars',
      jquery: 'vendor/jquery/jquery',
      jquery_scrollTo: 'vendor/jquery/jquery.scrollTo.min',
      jscookie: 'vendor/jscookie/js.cookie',
      easing: 'vendor/jquery/jquery.easing',
      angular: 'vendor/angular/angular.min',
      angularRoute: 'vendor/angular/angular-route.min',
      angularCookies: 'vendor/angular/angular-cookies.min',
      angularSanitize: 'vendor/angular/angular-sanitize.min',
      moment: 'vendor/moment/moment',
      moment_timezone: 'vendor/moment/moment-timezone-with-data',
      uikit: 'vendor/uikit/js/uikit_combined.min',
      modernizr: 'vendor/modernizr/modernizr',
      fastclick: 'vendor/fastclick/fastclick',
      placeholder: 'vendor/placeholder/placeholder',
      underscore: 'vendor/underscore/underscore',
      history: 'vendor/history/jquery.history',
      app: 'app',

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
      idletimer: 'plugins/jquery.idletimer.js',
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
      components: path.resolve(__dirname, 'src/client/components'),
      containers: path.resolve(__dirname, 'src/client/containers'),
      actions: path.resolve(__dirname, 'src/client/actions'),
      api: path.resolve(__dirname, 'src/client/api'),
      lib: path.resolve(__dirname, 'src/public/js/modules')
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
      { test: /angular\.min\.js/, use: 'exports-loader?angular' },
      { test: /uikit_combined\.min\.js/, use: 'exports-loader?UIkit' },
      {
        test: /\.sass$/,
        exclude: path.resolve(__dirname, 'node_modules'),
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '/public/css'
            }
          },
          {
            loader: 'css-loader',
            options: { minimize: true }
          },
          'postcss-loader',
          'sass-loader'
        ]
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
              ['@babel/plugin-proposal-class-properties', { loose: true }]
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
          ecma: 6,
          mangle: false
        }
      })
    ],
    splitChunks: {
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: 'vendor',
          chunks: 'initial',
          enforce: true
        },
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        }
      }
    }
  },
  plugins: [
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
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new MiniCssExtractPlugin({
      filename: 'app.min.css'
    })
  ],
  performance: {
    hints: 'warning',
    maxEntrypointSize: 400000,
    maxAssetSize: 1000000
  }
}
