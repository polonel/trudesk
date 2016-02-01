/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

requirejs.config({
    baseUrl: "/js/",
    paths: {
        //Always Load
        jquery:         'vendor/jquery/jquery',
        jquery_scrollTo:'vendor/jquery/jquery.scrollTo.min',
        //foundation:     'vendor/foundation/foundation.min',
        foundation:     'https://cdnjs.cloudflare.com/ajax/libs/foundation/5.5.0/js/foundation.min',
        angular:        'https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min',
        angularRoute:   'https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular-route',
        angularCookies: 'https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular-cookies',
        uikit:          'vendor/uikit/js/uikit_custom',
        modernizr:      'vendor/modernizr/modernizr',
        fastclick:      'vendor/fastclick/fastclick',
        placeholder:    'vendor/placeholder/placeholder',
        nicescroll:     'vendor/nicescroll/nicescroll.min',
        underscore:     'vendor/underscore/underscore',
        //socketio:       '/socket.io/socket.io',
        //socketio:       'https://cdn.socket.io/socket.io-1.2.1',
        history:        'vendor/history/jquery.history',
        app:            'app',

        async:          'vendor/async/async',
        jquery_custom:  'plugins/jquery.custom',
        datatables:     'vendor/datatables/jquery.dataTables',
        dt_responsive:  'vendor/datatables/dataTables.responsive',
        dt_foundation:  'vendor/datatables/dataTables.foundation',
        dt_grouping:    'vendor/datatables/dataTables.grouping',
        dt_scroller:    'vendor/datatables/dataTables.scroller',
        flot:           'vendor/flot/jquery.flot',
        flot_symbol:    'vendor/flot/jquery.flot.symbol',
        flot_time:      'vendor/flot/jquery.flot.time',
        flot_tooltip:   'vendor/flot/jquery.flot.tooltip',
        fullcalendar:   'vendor/fullcalendar/fullcalendar.min',
        moment:         'vendor/fullcalendar/moment.min',
        easypiechart:   'vendor/easypiechart/easypiechart',
        chosen:         'vendor/chosen/chosen.jquery.min',
        autogrow:       'plugins/autogrow',
        pace:           'vendor/pace/pace.min',
        tomarkdown:     'vendor/tomarkdown/tomarkdown',
        enjoyhint:      'vendor/enjoyhint/enjoyhint.min',
        colorpicker:    'vendor/simplecolorpicker/jquery.simplecolorpicker',
        datepicker:     'vendor/datepicker/foundation-datepicker',
        d3:             'vendor/d3/d3.min',
        metricsgraphics:'vendor/metricsgraphics/metricsgraphics.min',
        peity:          'vendor/peity/jquery.peity.min',
        countup:        'vendor/countup/countUp.min',
        velocity:       'vendor/velocity/velocity.min',
        selectize:      'vendor/selectize/selectize',
        waves:          'vendor/waves/waves'
    },
    config: {
        "uikit": {
            base: "/js/vendor/uikit/js"
        }
    },
    shim: {
        foundation: {
            deps: ['jquery', 'jquery_scrollTo', 'jquery_custom', 'modernizr', 'fastclick', 'placeholder', 'history', 'pace', 'velocity']
        },

        angular: {
            deps: ['foundation'],
            exports: 'angular'
        },

        angularRoute:  {
            deps: ['angular']
        },

        angularCookies: {
            deps: ['angular']
        },

        uikit: {
            deps: ['jquery', 'moment']
        },

        jquery_custom: {
            deps: ['jquery']
        },

        datatables: {
            deps: ['jquery']
        },

        dt_foundation: {
            deps: ['jquery', 'datatables', 'foundation']
        },

        dt_responsive: {
            deps: ['jquery', 'datatables']
        },

        dt_scroller: {
            deps: ['jquery', 'datatables']
        },

        dt_grouping: {
            deps: ['jquery', 'datatables']
        },

        nicescroll: {
            deps: ['jquery']
        },

        flot_time: {
            deps: ['jquery', 'flot']
        },

        flot_symbol: {
            deps: ['jquery', 'flot']
        },

        flot_tooltip: {
            deps: ['jquery', 'flot']
        },

        fullcalendar: {
            deps: ['jquery', 'moment']
        },

        easypiechart: {
            deps: ['jquery']
        },

        autogrow: {
            deps: ['jquery']
        },

        pace: {
            deps: ['jquery']
        },

        chosen: {
            deps: ['jquery']
        },

        history: {
            deps: ['jquery']
        },

        enjoyhint: {
            deps: ['jquery', 'jquery_scrollTo']
        },

        colorpicker: {
            deps: ['jquery']
        },

        datepicker: {
            deps: ['jquery', 'foundation']
        },

        d3: {
            deps: []
        },

        metricsgraphics: {
            deps: ['d3', 'jquery']
        },

        peity: {
            deps: ['jquery']
        },

        countup: {
            deps: ['jquery']
        },

        selectize: {
            deps: ['jquery']
        },

        waves: {
            deps: ['jquery']
        }
    },
    priority: [
        "angular"
    ]
});