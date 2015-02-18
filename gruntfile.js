module.exports = function(grunt) {
    require('matchdep').filterDev("grunt-*").forEach(grunt.loadNpmTasks);

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
            gruntfile: {
                files: ['gruntfile.js'],
                tasks: ['minjs']
            },
            frontend: {
                options: {
                    livereload: true
                },
                files: [
                    'public/**/*.css',
                    'public/**/*.js',
                    'views/**/*.hbs',
                    '!public/js/main.min.js'
                ],
                tasks: ['minjs']
            },
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
                    'routes/**/*.js'
                ],
                tasks: ['express:web'],
                options: {
                    nospawn: true,
                    atBegin: true
                }
            }
        },

        parallel: {
            web: {
                options: {
                    stream: true
                },
                tasks: [
                    {
                        grunt: true,
                        args: ['watch:gruntfile']
                    },
                    {
                        grunt: true,
                        args: ['watch:frontend']
                    }, {
                        grunt: true,
                        args: ['watch:sass']
                    }, {
                        grunt: true,
                        args: ['watch:web']
                    }]
            }
        },

        cssmin: {
            minify: {
                expand: true,
                cwd: 'public/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'public/css/',
                ext: '.min.css'
            }
        },

        sass: {
            build: {
                files: {
                    'public/css/app.css': 'src/sass/app.sass'
                }
            }
        },

        uglify: {
            options: {
//                compress: {
//                    drop_console: true
//                }
            },
            target: {
                files: {
                    'public/js/trudesk.min.js':
                        [
//                            'public/js/vendor/modernizr/modernizr.js',
//                            'public/js/vendor/jquery/jquery.js',
//                            'public/js/vendor/fastclick/fastclick.js',
//                            'public/js/vendor/foundation/foundation.min.js',
//                            'public/js/vendor/datatables/jquery.dataTables.js',
//
//                            'public/js/vendor/datatables/dataTables.responsive.js',
//                            'public/js/vendor/flot/jquery.flot.js',
//                            'public/js/vendor/flot/jquery.flot.symbol.min.js',
//                            'public/js/vendor/flot/jquery.flot.time.min.js',
//                            'public/js/vendor/flot/jquery.flot.tooltip.js',
//                            'public/js/vendor/fullcalendar/moment.min.js',
//                            'public/js/vendor/fullcalendar/fullcalendar.min.js',
//                            'public/js/plugins/plugins.min.js',
//                            'public/js/client.js',
//
//                            //RequireJS
//                            'public/js/vendor/requirejs/requirejs.min.js'

                    ]
                }
            }
        }

    });

    grunt.registerTask('buildcss', ['sass', 'cssmin']);
    grunt.registerTask('minjs', ['uglify']);
    grunt.registerTask('server', 'launch webserver and watch tasks', ['parallel:web']);
    grunt.registerTask('default', ['server']);
};