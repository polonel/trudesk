var path = require('path');
var webpack = require('webpack');

module.exports = {
    //context: path.resolve(__dirname, 'public/js'),
    entry : {
        vendor: ['jquery', 'jquery_custom', 'angular', 'angularRoute', 'angularCookies', 'angularSanitize', 'datatables', 'dt_responsive', 'dt_grouping', 'dt_ipaddress', 'modernizr', 'underscore'],
        truRequire: 'expose-loader?truRequire!' + path.resolve(__dirname, './src/public/js/truRequire'),
        "trudesk.min": path.resolve(__dirname, 'src/public/js/app.js')
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public/js'),
        publicPath: '/js/'
    },
    resolve: {
        modules: [path.resolve(__dirname, 'src/public/js/')],
        alias: {
            //server side
            roles:          path.resolve(__dirname, 'src/permissions/roles'),

            //client side
            jquery:         'vendor/jquery/jquery',
            jquery_scrollTo:'vendor/jquery/jquery.scrollTo.min',
            angular:        'vendor/angular/angular.min',
            angularRoute:   'vendor/angular/angular-route.min',
            angularCookies: 'vendor/angular/angular-cookies.min',
            angularSanitize:'vendor/angular/angular-sanitize.min',
            moment:         'vendor/moment/moment',
            uikit:          'vendor/uikit/js/uikit_combined.min',
            modernizr:      'vendor/modernizr/modernizr',
            fastclick:      'vendor/fastclick/fastclick',
            placeholder:    'vendor/placeholder/placeholder',
            // nicescroll:     'vendor/nicescroll/nicescroll.min',
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
            flot:           'vendor/flot/jquery.flot',
            flot_symbol:    'vendor/flot/jquery.flot.symbol',
            flot_time:      'vendor/flot/jquery.flot.time',
            flot_tooltip:   'vendor/flot/jquery.flot.tooltip',
            easypiechart:   'vendor/easypiechart/easypiechart',
            chosen:         'vendor/chosen/chosen.jquery.min',
            autogrow:       'plugins/autogrow',
            pace:           'vendor/pace/pace.min',
            tomarkdown:     'vendor/tomarkdown/tomarkdown',
            enjoyhint:      'vendor/enjoyhint/enjoyhint.min',
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
            waves:          'vendor/waves/waves',
            isinview:       'plugins/jquery.isinview',
            jquery_docsize: 'plugins/jquery.documentsize',
            formvalidator:  'vendor/formvalidator/jquery.form-validator',
            qrcode:         'vendor/qrcode/jquery.qrcode.min',
            tether:         'vendor/tether/tether.min',
            shepherd:       'vendor/shepherd/js/shepherd.min',
            snackbar:       'plugins/snackbar'
        }
    },
    externals: {
        //These are bunbled already
        jsdom: 'jsdom',
        canvas: 'canvas'
    },
    module: {
        rules: [
            { test: /angular\.min\.js/, use: 'exports-loader?angular' },
            { test: /uikit_combined\.min\.js/, use: 'exports-loader?UIkit' }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            "window.jQuery": 'jquery',
            "window.$": 'jquery',
            Modernizr: 'modernizr',
            "window.Modernizr": 'modernizr',
            moment: 'moment',
            "window.moment": 'moment',
            setImmediate: 'async'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['vendor'],
            minChunks: Infinity
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, [/moment$/]),
        new webpack.optimize.OccurrenceOrderPlugin()
    ],
    performance: {
        hints: "warning",
        maxEntrypointSize: 10000000,
        maxAssetSize: 80000000
    }
};