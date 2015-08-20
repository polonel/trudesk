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
                    'routes/**/*.js'
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
                    }]
            },
            docs: {
                options: {
                    stream: true
                },
                tasks: [
                    {
                        grunt: true,
                        args: ['watch:docs']
                    }
                ]
            }
        },

        cssmin: {
            target: {
                files:  {
                    'public/css/plugins.css' : [
                        'public/css/plugins/simplecolorpicker/jquery.simplecolorpicker.css',
                        'public/css/plugins/simplecolorpicker/jquery.simplecolorpicker-fontawesome.css'
                        //'public/css/plugins/simplecolorpicker/jquery.simplecolorpicker-regularfont.css',


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
            build: {
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

        jsdoc : {
            dist : {
                src: ['README.md', 'src/**/*.js', '!src/public/js/vendor/**/*.js'],
                options: {
                    destination: 'docs',
                    template: 'docs/jaguarjs-jsdoc',
                    configure: 'docs/jaguarjs-jsdoc/conf.json'
                    //template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                    //configure : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json"
                }
            }
        }
    });

    grunt.registerTask('buildcss', ['sass', 'cssmin']);
    grunt.registerTask('builddocs', ['jsdoc', 'apidoc']);
    grunt.registerTask('watchdocs', ['parallel:docs']);
    grunt.registerTask('server', 'launch webserver and watch tasks', ['parallel:web']);
    grunt.registerTask('default', ['server']);
};