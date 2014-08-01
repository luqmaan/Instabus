var gulp = require('gulp');
var webserver = require('gulp-webserver');
var taskListing = require('gulp-task-listing');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var cssmin = require('gulp-cssmin');
var concat = require('gulp-concat');

//FIXME: hook this up https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md

gulp.task('cssmin', function() {
    gulp.src(['./css/*.css', '!./css/main.min.css'] )
        .pipe(cssmin())
        .pipe(concat('main.min.css'))
        .pipe(gulp.dest('./css'));
});

gulp.task('build', function() {
    var bundler = browserify({
        entries: ['./js/main.js'],
        extensions: ['.js'],
        debug: true
    });

    var bundle = function() {
        return bundler
            .bundle()
            .on('error', function(e) {
                gutil.log(gutil.colors.red("shit broke"), e);
            })
            .pipe(source('bundle.js'))
            .pipe(gulp.dest('.'))
            .on('end', function() {
                gutil.log(gutil.colors.blue("shit finished"));
            });
    };

    return bundle();
});

gulp.task('serve', function() {
    gulp.src('.')
        .pipe(webserver({
            port: 1234,
            // livereload: true,
            directoryListing: true,
            fallback: './index.html'
        })
    );
});

gulp.task('deploy', ['cssmin', 'build']);

gulp.task('default', taskListing);
