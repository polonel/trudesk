module.exports = function(grunt) {
    require('matchdep').filterAll("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        express: {
            options: {
                //Override Defaults
            },
            web: {
                options: {
                    script: 'app.js',
                    port: 8118
                }
            }
        },

        watch: {
            //gruntfile: {
            //    files: ['gruntfile.js'],
            //    tasks: ['minjs']
            //},
            //frontend: {
            //    options: {
            //        livereload: true
            //    },
            //    files: [
            //        'public/**/*.css',
            //        'public/**/*.js',
            //        'views/**/*.hbs',
            //        '!public/js/main.min.js'
            //    ],
            //    tasks: ['minjs']
            //},
            sass: {
                files: [
                    'src/sass/**/*.sass'
                ],
                tasks: ['sass', 'cssmin']
            },
            web: {
                files: [
                    '*.js',
                    'src/**/*.js',
                    'routes/**/*.js',
                    'plugins/**/*.js'
                ],
                tasks: ['express:web'],
                options: {
                    nospawn: true,
                    atBegin: true
                }
            },
            docs: {
                files: [
                    '*.js',
                    'src/**/*.js',
                    'routes/**/*.js'
                ],
                tasks: ['jsdoc', 'apidoc']
            }
        },

        parallel: {
            web: {
                options: {
                    stream: true
                },
                tasks: [
                    //{
                    //    grunt: true,
                    //    args: ['watch:gruntfile']
                    //},
                    //{
                    //    grunt: true,
                    //    args: ['watch:frontend']
                    //},
                    {
                        grunt: true,
                        args: ['watch:sass']
                    }, {
                        grunt: true,
                        args: ['watch:web']
                    }
                ]
            },
            docs: {
                options: {
                    stream: true
                },
                tasks: [{
                    grunt: true,
                    args: ['watch:docs']
                }]
            }
        },

        cssmin: {
            target: {
                files: {
                    'public/css/plugins.css': [
                        'public/css/plugins/datatables/dataTables.scroller.css',
                        'public/css/plugins/datatables/dataTables.foundation.css',
                        'public/js/vendor/chosen/chosen.css',
                        'public/js/vendor/pace/pace.theme.css',
                        'public/js/vendor/enjoyhint/enjoyhint.css',
                        'public/js/vendor/metricsgraphics/metricsgraphics.css',
                        'public/css/vendor/font-awesome.min.css',
                        'public/css/plugins/simplecolorpicker/jquery.simplecolorpicker.css',
                        'public/css/plugins/simplecolorpicker/jquery.simplecolorpicker-fontawesome.css',
                        //'public/css/plugins/simplecolorpicker/jquery.simplecolorpicker-regularfont.css',
                        //'public/css/plugins/datepicker/foundation-datepicker.css',
                        'public/js/vendor/uikit/css/uikit.css',
                        'public/js/vendor/uikit/css/uikit_custom.css',
                        'public/js/plugins/snackbar.css',
                        'public/js/vendor/c3/c3.css',
                        'public/js/vendor/formvalidator/theme-default.css'
                    ]
                }
            },
            minify: {
                expand: true,
                cwd: 'public/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'public/css/',
                ext: '.min.css'
            }
        },

        sass: {
            dist: {
                files: {
                    'public/css/app.css': 'src/sass/app.sass'
                }
            }
        },

        apidoc: {
            trudesk: {
                src: "src/controllers/",
                dest: "apidocs/",
                options: {
                    //debug: true,
                    includeFilters: ['.*\\.js$'],
                    excludeFilters: ['node_modules/']
                }
            }
        },

        jsdoc: {
            dist: {
                src: ['README.md', 'src/**/*.js', '!src/public/js/vendor/**/*.js', '!src/public/js/plugins/*.js'],
                options: {
                    destination: 'docs',
                    template: 'docs/jaguarjs-jsdoc',
                    configure: 'docs/jaguarjs-jsdoc/conf.json'
                        //template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                        //configure : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json"
                }
            }
        },

        uglify: {
            uikit: {
                options: {
                    beautify: false,
                    mangle: false
                },

                src: [
                    'src/public/js/vendor/uikit/js/uikit.js',
                    'src/public/js/vendor/uikit/js/components/accordion.js',
                    'src/public/js/vendor/uikit/js/components/autocomplete.js',
                    'src/public/js/vendor/uikit/js/components/datepicker.js',
                    'src/public/js/vendor/uikit/js/components/form-password.js',
                    'src/public/js/vendor/uikit/js/components/form-select.js',
                    'src/public/js/vendor/uikit/js/components/grid.js',
                    'src/public/js/vendor/uikit/js/components/htmleditor.js',
                    'src/public/js/vendor/uikit/js/components/lightbox.js',
                    'src/public/js/vendor/uikit/js/components/nestable.js',
                    'src/public/js/vendor/uikit/js/components/notify.js',
                    'src/public/js/vendor/uikit/js/components/pagination.js',
                    'src/public/js/vendor/uikit/js/components/parallax.js',
                    'src/public/js/vendor/uikit/js/components/grid-parallax.js',
                    'src/public/js/vendor/uikit/js/components/search.js',
                    'src/public/js/vendor/uikit/js/components/slider.js',
                    'src/public/js/vendor/uikit/js/components/slideshow.js',
                    'src/public/js/vendor/uikit/js/components/slideshow-fx.js',
                    'src/public/js/vendor/uikit/js/components/sortable.js',
                    'src/public/js/vendor/uikit/js/components/sticky.js',
                    'src/public/js/vendor/uikit/js/components/timepicker.js',
                    'src/public/js/vendor/uikit/js/components/tooltip.js',
                    'src/public/js/vendor/uikit/js/components/upload.js',

                    'src/public/js/vendor/uikit/js/custom.js'
                ],
                dest: 'src/public/js/vendor/uikit/js/uikit_combined.min.js'
            }
        },

        requirejs: {
            compile: {
                options: {
                    appDir: 'src/public/js',
                    baseUrl: './',
                    mainConfigFile: 'src/public/js/config.js',
                    dir: 'public/js',
                    removeCombined: true,
                    preserveLicenseComments: false,
                    kipDirOptimize: false,
                    optimize: 'uglify2',
                    //optimize: 'none',
                    uglify2: {
                        mangle: false
                    },
                    modules: [{
                        name: 'trudesk.min',
                        create: true,
                        include: [
                            'jquery',
                            'jquery_scrollTo',
                            'jquery_custom',
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
                            'd3pie',
                            'peity',
                            'countup',
                            'selectize',
                            'waves',
                            'formvalidator',
                            'snackbar',

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
                    }],
                    paths: {
                        //foundation: 'empty:',
                        angular: 'empty:',
                        angularRoute: 'empty:',
                        angularCookies: 'empty:'
                    },
                    keepBuildDir: true
                }
            }
        },

        shell: {
            requirejs: {
                command: 'r.js -o rBuild.js'
            },
            requirejswin: {
                command: 'r.js.cmd -o rBuild.js'
            }
        }
    });

    grunt.registerTask('buildcss', ['sass', 'cssmin']);
    grunt.registerTask('builddocs', ['jsdoc', 'apidoc']);
    grunt.registerTask('watchdocs', ['parallel:docs']);
    grunt.registerTask('server', 'launch webserver and watch tasks', ['parallel:web']);
    grunt.registerTask('build', ['uglify:uikit', 'shell:requirejs', 'buildcss', 'builddocs']);
    grunt.registerTask('sbuild', ['shell:requirejs']);
    grunt.registerTask('swinbuild', ['shell:requirejswin']);
    grunt.registerTask('winbuild', ['uglify:uikit', 'shell:requirejswin', 'buildcss', 'builddocs']);
    grunt.registerTask('default', ['server']);
};
