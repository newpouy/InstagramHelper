'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: true });
var args = require('yargs').argv;

gulp.task('watch', function () {
  return $.watch('./src/js/*.js', { ignoreInitial: false })
    .pipe(gulp.dest('./build/js/'));
});

gulp.task('zip', () => {
  return gulp
    .src('./build/**/')
    .pipe($.zip('archive.zip'))
    .pipe(gulp.dest('./'))
});

gulp.task('build', ['clean'], () => {

  log(`gulp build started at ${new Date()}`);

  var uglifyjs = require('uglify-es');
  var composer = require('gulp-uglify/composer');
  var minify = composer(uglifyjs, console);

  var isNotMinifiedFile = (file) => /^(?:(?!\.min).)*\.js$/.test(file.history[0]);

  var isProductionMode = () => args.production ? true : false;

  var isValidJsFile = (file) => isProductionMode() ? 'vue.js' !== file.history[0].replace(/^.*[\\\/]/, '') : true; //don't copy vue.js if production mode

  return gulp
    .src('./src/**/*.*', { base: './src/' })
    .pipe($.if(args.verbose, $.print()))
    .pipe($.if('*.html', $.minifyHtml({ empty: true })))
    .pipe($.if('*.css', $.csso()))
    .pipe($.filterBy(isValidJsFile))
    .pipe($.if(isProductionMode, $.if(isNotMinifiedFile, minify().on('error', function (err) {
      $.util.log($.util.colors.red('[Error]'), err.toString());
    }))))
    .pipe($.if(isProductionMode, $.if('*like*.html', $.replace('vue.js', 'vue.min.js'))))
    .pipe($.if(isProductionMode, $.if('*follow*.html', $.replace('vue.js', 'vue.min.js'))))
    .pipe($.if(isProductionMode, $.if('*block*.html', $.replace('vue.js', 'vue.min.js'))))
    .pipe(gulp.dest('./build/'));
});

gulp.task('clean', (cb) => {

  var rimraf = require('rimraf');

  log('Clean task is started...');
  rimraf('./build', () => rimraf('./archive.zip', cb));

});

gulp.task('vet', () => {

  return gulp
    .src('./src/js/**/*.js')
    .pipe($.if(args.verbose, $.print()))
    .pipe($.jscs())
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish', { verbose: true }))
    .pipe($.jshint.reporter('fail'));
});

function log(msg) {
  if (typeof (msg) === 'object') {
    for (var item in msg) {
      if (msg.hasOwnProperty(item)) {
        $.util.log($.util.colors.blue(msg[item]));
      }
    }
  } else {
    $.util.log($.util.colors.blue(msg));
  }
}
