({
    appDir: 'src/public/js',
    baseUrl: './',
    mainConfigFile: 'src/public/js/config.js',
    dir: 'public/js',
    removeCombined: true,
    preserveLicenseComments: false,
    kipDirOptimize: false,
    //optimize: 'uglify2',
    optimize: 'none',
    uglify2: {
    mangle: false
},
modules: [
    {
        name: 'trudesk.min',
        create: true,
        include: [
            'jquery',
            'jquery_scrollTo',
            'foundation',
            'uikit',
            'angular',
            'angularRoute',
            'angularCookies',
            'modernizr',
            'fastclick',
            'placeholder',
            'nicescroll',
            'underscore',
            'history',
            'd3',
            'metricsgraphics',
            'peity',
            'countup',
            'selectize',
            'waves',

            '../../src/permissions/roles',

            'angularjs/main',
            'angularjs/controllers',
            'app',

            'modules/ajaxify',
            'modules/ajaximgupload',
            'modules/attachmentUpload',

            'pages/accounts',
            'pages/dashboard',
            'pages/editaccount',
            'pages/groups',
            'pages/messages',
            'pages/reports',
            'pages/singleTicket',
            'pages/tickets'
        ],
        shim: {
            angular: {
                exports: 'angular'
            }
        }
    }
],
    paths: {
    foundation: 'empty:',
        angular: 'empty:',
        angularRoute: 'empty:',
        angularCookies: 'empty:'
},
keepBuildDir: true
})