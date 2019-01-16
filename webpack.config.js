var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    //context: path.resolve(__dirname, 'public/js'),
    target: 'web',
    entry : {
        vendor: ['jquery', 'jquery_custom', 'angular', 'angularRoute', 'angularCookies', 'angularSanitize', 'datatables', 'dt_responsive', 'dt_grouping', 'dt_ipaddress', 'modernizr', 'underscore'],
        truRequire: 'expose-loader?truRequire!' + path.resolve(__dirname, './src/public/js/truRequire'),
        'trudesk.min': path.resolve(__dirname, 'src/public/js/app.js')
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public/js'),
        publicPath: '/js/'
    },
    resolve: {
        modules: [path.resolve(__dirname, 'src/public/js/'), 'node_modules'],
        alias: {
            //server side
            roles:          path.resolve(__dirname, 'src/permissions/roles'),

            //client side
            jquery:         'vendor/jquery/jquery',
            jquery_scrollTo:'vendor/jquery/jquery.scrollTo.min',
            jscookie:       'vendor/jscookie/js.cookie',
            easing:         'vendor/jquery/jquery.easing',
            angular:        'vendor/angular/angular.min',
            angularRoute:   'vendor/angular/angular-route.min',
            angularCookies: 'vendor/angular/angular-cookies.min',
            angularSanitize:'vendor/angular/angular-sanitize.min',
            moment:         'vendor/moment/moment',
            moment_timezone:'vendor/moment/moment-timezone-with-data',
            uikit:          'vendor/uikit/js/uikit_combined.min',
            modernizr:      'vendor/modernizr/modernizr',
            fastclick:      'vendor/fastclick/fastclick',
            placeholder:    'vendor/placeholder/placeholder',
            underscore:     'vendor/underscore/underscore',
            history:        'vendor/history/jquery.history',
            app:            'app',

            async:          'vendor/async/async',
            jquery_custom:  'plugins/jquery.custom',
            datatables:     'vendor/datatables/jquery.dataTables',
            dt_responsive:  'vendor/datatables/dataTables.responsive',
            dt_grouping:    'vendor/datatables/dataTables.grouping',
            dt_scroller:    'vendor/datatables/dataTables.scroller',
            dt_ipaddress:   'vendor/datatables/dataTables.ipaddress',
            easypiechart:   'vendor/easypiechart/easypiechart',
            chosen:         'vendor/chosen/chosen.jquery.min',
            autogrow:       'plugins/autogrow',
            pace:           'vendor/pace/pace.min',
            tomarkdown:     'vendor/tomarkdown/tomarkdown',
            colorpicker:    'vendor/simplecolorpicker/jquery.simplecolorpicker',
            datepicker:     'vendor/datepicker/foundation-datepicker',
            d3:             'vendor/d3/d3.min',
            c3:             'vendor/c3/c3',
            metricsgraphics:'vendor/metricsgraphics/metricsgraphics.min',
            d3pie:          'vendor/d3pie/d3pie.min',
            peity:          'vendor/peity/jquery.peity.min',
            countup:        'vendor/countup/countUp.min',
            velocity:       'vendor/velocity/velocity.min',
            selectize:      'vendor/selectize/selectize',
            multiselect:    'vendor/multiselect/js/jquery.multi-select',
            waves:          'vendor/waves/waves',
            isinview:       'plugins/jquery.isinview',
            jquery_docsize: 'plugins/jquery.documentsize',
            idletimer:      'plugins/jquery.idletimer.js',
            jquery_steps:   'plugins/jquery.steps',
            jquery_actual:  'plugins/jquery.actual',
            formvalidator:  'vendor/formvalidator/jquery.form-validator',
            qrcode:         'vendor/qrcode/jquery.qrcode.min',
            tether:         'vendor/tether/tether',
            shepherd:       'vendor/shepherd/js/shepherd.min',
            easymde:        'vendor/easymde/dist/easymde.min',
            snackbar:       'plugins/snackbar',

            sass:           path.resolve(__dirname, 'src/sass'),
            components:     path.resolve(__dirname, 'src/client/components')
        },
        extensions: ['.js', '.jsx']
    },
    externals: {
        //These are bunbled already
        jsdom: 'jsdom',
        canvas: 'canvas'
    },
    module: {
        rules: [
            { test: /angular\.min\.js/, use: 'exports-loader?angular' },
            { test: /uikit_combined\.min\.js/, use: 'exports-loader?UIkit' },
            { test: /\.sass$/, exclude: path.resolve(__dirname, 'node_modules'), use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [{loader: 'css-loader', options: {minimize: false}}, 'sass-loader'],
                publicPath: '/public/css'
            })},
            { test: /\.jsx$/, exclude: /node_modules/, loader: 'babel-loader?cacheDirectory' }
        ]
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
        new webpack.optimize.CommonsChunkPlugin({
            name: ['vendor'],
            minChunks: Infinity
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new ExtractTextPlugin({
            filename: '../css/app.min.css',
            allChunks: true
        })
    ],
    performance: {
        hints: 'warning',
        maxEntrypointSize: 10000000,
        maxAssetSize: 80000000
    }
};