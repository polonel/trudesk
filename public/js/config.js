requirejs.config({
    baseUrl: "/js/",
    paths: {
        //Always Load
        jquery:         'vendor/jquery/jquery',
        //foundation:     'vendor/foundation/foundation.min',
        foundation:     'https://cdnjs.cloudflare.com/ajax/libs/foundation/5.5.0/js/foundation.min',
        angular:        'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.5/angular.min',
        angularRoute:   'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.5/angular-route',
        modernizr:      'vendor/modernizr/modernizr',
        fastclick:      'vendor/fastclick/fastclick',
        placeholder:    'vendor/placeholder/placeholder',
        nicescroll:     'vendor/nicescroll/nicescroll.min',
        underscore:     'vendor/underscore/underscore',
        //socketio:       '/socket.io/socket.io',
        //socketio:       'https://cdn.socket.io/socket.io-1.2.1',
        history:        'vendor/history/jquery.history',

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
        autogrow:       'plugins/autogrow'
    },
    shim: {
        foundation: {
            deps: ['jquery', 'jquery_custom', 'modernizr', 'fastclick', 'placeholder', 'history']
        },

        angular: {
            exports: 'angular'
        },

        angularRoute: ['angular'],

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
        }
    },
    priority: [
        "angular"
    ]
});