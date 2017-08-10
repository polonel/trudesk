module.exports = function (grunt) {

  require('matchdep').filterAll("grunt-*").forEach(grunt.loadNpmTasks);

  grunt.initConfig({

    copy: {
      js: {
        expand: true,
        cwd: 'src/js',
        src: 'snackbar.js',
        dest: 'dist/'
      }
    },

    jshint: {
      files: [
        'Gruntfile.js',
        'src/js/*.js'
      ],

      options: {
        globals: {
          console: true
        }
      }
    },

    uglify: {
      options: {
        mangle: true,
        compress: {
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true,
          drop_console: true
        },
        sourceMap: true,
        sourceMapName: 'dist/snackbar.min.js.map',
        preserveComments: 'some'
      },
      js: {
        files: {
          'dist/snackbar.min.js': ['src/js/snackbar.js']
        }
      }
    },

    sass: {
      dist: {
        options: {
          style: 'expanded'
        },
        files: {
          'dist/snackbar.css': 'src/sass/snackbar.sass'
        }
      }
    },

    cssmin: {
      minify: {
        expand: true,
        cwd: 'dist/',
        src: ['*.css', '!*.min.css'],
        dest: 'dist/',
        ext: '.min.css'
      }
    },

  });

  grunt.registerTask('build', [
    'jshint',
    'copy',
    'uglify',
    'sass',
    'cssmin'
  ]);
};