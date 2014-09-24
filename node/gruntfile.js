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
                    port: 3000
                }
            }
        },

        watch: {
            frontend: {
                options: {
                    livereload: true
                },
                files: [
                    'public/**/*.css',
                    'public/**/*.js',
                    'views/**/*.hbs'
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
                tasks: [{
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
                compress: {
                    drop_console: true
                }
            },
            target: {
                files: {
                    'public/js/client.min.js': ['public/js/client.js'],
                    'public/js/plugins/plugins.min.js': ['public/js/plugins/plugins.js']
                }
            }
        }

    });

    grunt.registerTask('buildcss', ['sass', 'cssmin']);
    grunt.registerTask('minjs', ['uglify']);
    grunt.registerTask('server', 'launch webserver and watch tasks', ['parallel:web']);
    grunt.registerTask('default', ['server']);
};