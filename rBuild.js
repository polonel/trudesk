({
    appDir: 'src/public/js',
    baseUrl: './',
    mainConfigFile: 'src/public/js/config.js',
    dir: 'public/js',
    removeCombined: true,
    preserveLicenseComments: false,
    kipDirOptimize: false,
    optimize: 'uglify2',
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
                'angular',
                'angularRoute',
                'modernizr',
                'fastclick',
                'placeholder',
                'nicescroll',
                'underscore',
                'history',

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
        //{
        //    name: 'page-accounts',
        //    create: true,
        //    include: [ 'pages/accounts' ],
        //    exclude: [ 'trudesk.min' ]
        //}
    ],
    paths: {
        foundation: 'empty:',
        angular: 'empty:',
        angularRoute: 'empty:'
    },
    keepBuildDir: true
})