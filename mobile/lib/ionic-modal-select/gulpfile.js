var gulp = require('gulp');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var addsrc = require('gulp-add-src');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var order = require("gulp-order");
var plumber = require("gulp-plumber");

var webpackStream = require('webpack-stream');
var webpack = require("webpack");
// Import at the top of the file
var karma = require('karma').Server;

var paths = {
  es6: ['./src/*.js'],
  webpack: ['./src/main.js'],
  templates : ['./src/*.html'],
  output: './dist',
};

var webPackConfig = require('./webpack.config');
var webPackConfigProduction = require('./webpack.config.production');


// use webpack.config.js to build modules
gulp.task('webpack', () => {
  return gulp.src(paths.webpack)
    .pipe(plumber())
    .pipe(webpackStream(webPackConfig))
    .pipe(gulp.dest(paths.output))
});

gulp.task('webpack-production', () => {
  return gulp.src(paths.webpack)
    .pipe(plumber())
    .pipe(webpackStream(webPackConfigProduction))
    .pipe(gulp.dest(paths.output))
});


/**
* Test task, run test once and exit
*/
gulp.task('test', function(done) {
    var config = {
        configFile: __dirname + '/tests/my.conf.js',
        singleRun: true
    };
    var server = new karma(config);
    server.start();
});


gulp.task('watch', function() {
  gulp.watch([paths.es6, paths.templates], ['webpack', 'webpack-production']);
});

gulp.task('default', ['webpack', 'webpack-production']);
