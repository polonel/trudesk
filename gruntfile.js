module.exports = function (grunt) {
  require('matchdep')
    .filterAll('grunt-*')
    .forEach(grunt.loadNpmTasks)

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    express: {
      options: {
        // Override Defaults
      },
      web: {
        options: {
          script: 'app.js',
          port: 8118
        }
      }
    },

    watch: {
      web: {
        files: ['*.js', 'src/**/*.js', 'plugins/**/*.js', '!src/public/**/*.js', '!src/client/**/*.js'],
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
            args: ['watch:web']
          },
          {
            grunt: true,
            args: ['shell:webpackWatch']
          }
        ]
      }
    },

    cssmin: {
      target: {
        files: {
          'public/css/plugins.css': [
            'public/css/plugins/datatables/dataTables.scroller.css',
            'public/css/plugins/datatables/dataTables.foundation.css',
            'src/public/js/vendor/chosen/chosen.css',
            'src/public/js/vendor/enjoyhint/enjoyhint.css',
            'src/public/js/vendor/metricsgraphics/metricsgraphics.css',
            'public/css/plugins/simplecolorpicker/jquery.simplecolorpicker.css',
            'public/css/plugins/simplecolorpicker/jquery.simplecolorpicker-fontawesome.css',
            'src/public/js/vendor/uikit/css/uikit.css',
            'src/public/js/vendor/uikit/css/uikit_custom.css',
            'src/public/js/plugins/snackbar.css',
            'src/public/js/vendor/c3/c3.css',
            'src/public/js/vendor/multiselect/css/multi-select.css',
            'src/public/js/vendor/formvalidator/theme-default.css',
            'src/public/js/vendor/shepherd/css/shepherd-theme-default.css',
            'src/public/js/vendor/shepherd/css/shepherd-theme-dark.css',
            'src/public/js/vendor/shepherd/css/shepherd-theme-arrows.css',
            'src/public/js/vendor/shepherd/css/shepherd-theme-arrows-fix.css',
            'src/public/js/vendor/shepherd/css/shepherd-theme-square.css',
            'src/public/js/vendor/shepherd/css/shepherd-theme-square-dark.css',
            'src/public/js/vendor/easymde/dist/easymde.min.css',
            'src/public/js/vendor/grapesjs/css/grapes.min.css'
          ]
        }
      },
      minify: {
        expand: true,
        cwd: 'public/css/',
        src: ['*.css', '!app.min.css', '!*.min.css'],
        dest: 'public/css/',
        ext: '.min.css'
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

    shell: {
      webpackWatch: 'npm run webpackwatch',
      webpackDev: 'npm run webpackdev',
      webpackDist: 'npm run webpackdist'
    }
  })

  grunt.registerTask('buildcss', ['uglify:uikit', 'cssmin'])
  grunt.registerTask('server', 'launch webserver and watch tasks', ['uglify:uikit', 'cssmin', 'parallel:web'])
  grunt.registerTask('build', ['uglify:uikit', 'cssmin', 'shell:webpackDist'])
  grunt.registerTask('devbuild', ['shell:webpackDev'])
  grunt.registerTask('default', ['server'])
}
