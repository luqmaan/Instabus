var gulp = require('gulp');
var webserver = require('gulp-webserver');
var taskListing = require('gulp-task-listing');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var cssmin = require('gulp-cssmin');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

//FIXME: hook this up https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md

gulp.task('cssmin', function() {
    gulp.src(['./css/*.css', '!./css/main.min.css'] )
        .pipe(cssmin())
        .pipe(concat('main.min.css'))
        .pipe(gulp.dest('./css'));
});

gulp.task('uglify', function() {
    gulp.src('./js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./')
    );
});

gulp.task('browserify-app', function() {
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

gulp.task('_serve', function() {
    gulp.src('.')
        .pipe(webserver({
            port: 1234
        })
    );
});

gulp.task('serve', ['browserify-app', '_serve']);
gulp.task('deploy', ['cssmin', 'uglify']);
gulp.task('default', taskListing);
