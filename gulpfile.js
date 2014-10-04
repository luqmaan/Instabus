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
var clean = require('gulp-clean');
var replace = require('gulp-replace');
var ghpages = require('gulp-gh-pages');
var git = require('gulp-git');
var bump = require('gulp-bump');
var tag = require('gulp-tag-version');
var version = require('./package.json').version;

// FIXME: hook this up https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md

gulp.task('clean', function () {
    return gulp.src('./dist/gh-pages/*')
        .pipe(clean());
});

gulp.task('build-css', function() {
    var src = [
        './src/css/leaflet.css',
        './src/css/leaflet-label.css',
        './src/css/nprogress.css',
        './src/css/progress.css',
        './src/css/main.css'
    ];
    return gulp.src(src)
        .pipe(cssmin())
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest('./dist/gh-pages/css'));
});

gulp.task('uglify', ['browserify-app'], function() {
    return gulp.src('./dist/gh-pages/js/bundle.js')
        .pipe(sourcemaps.init())
        .pipe(concat('./dist/gh-pages/js/bundle.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('.'));
});

gulp.task('browserify-app', function() {
    var bundler = browserify({
        entries: ['./src/js/main.js'],
        extensions: ['.js'],
        debug: true,
    });

    var bundle = function() {
        return bundler
            .bundle()
            .on('error', function(e) {
                gutil.log(gutil.colors.red("shit broke", e.toString()));
                this.emit('end');
            })
            .pipe(source('./dist/gh-pages/js/bundle.js'))
            .pipe(gulp.dest('.'))
            .on('end', function() {
                gutil.log(gutil.colors.blue("shit finished"));
            });
    };

    return bundle();
});

gulp.task('build-html', function() {
    var html = gulp.src('./src/html/index.html')
        .pipe(replace(/bundle.(css|js)/g, 'bundle.$1?v=' + version))
        .pipe(gulp.dest('./dist/gh-pages/'));
});

gulp.task('build-data', ['clean'], function() {
    gulp.src('./data/**.*')
        .pipe(gulp.dest('./dist/gh-pages/data'));
});

gulp.task('build-img', ['clean'], function() {
    gulp.src('./src/img/**.*')
        .pipe(gulp.dest('./dist/gh-pages/img'));
});
gulp.task('_serve', function() {
    return gulp.src('./dist/gh-pages/')
        .pipe(webserver({
            host: '0.0.0.0',
            port: 1234,
        })
    );
});

gulp.task('cname', function() {
    gulp.src('./CNAME')
        .pipe(gulp.dest('./dist/gh-pages/'));
});

gulp.task('deploy-gh-pages', ['build', 'bump'], function() {
    return gulp.src('./dist/gh-pages/**/*')
         .pipe(ghpages({cacheDir: '/tmp/ghettorappid'}))
});

gulp.task('bump', function() {
    return gulp.src('./package.json')
        .pipe(bump({type: 'patch'}))
        .pipe(gulp.dest('./'))
        .pipe(git.commit('Update version for release :shit:'))
        .pipe(tag())
        .pipe(git.push('origin', 'master', {args: '--tags'}));
});

gulp.task('watch', function() {
    gulp.watch('./src/js/**', ['browserify-app']);
    gulp.watch('./src/css/**', ['build-css']);
    gulp.watch('./src/html/**', ['build-html']);
});

gulp.task('serve', ['clean', 'build-data', 'build-img', 'build-css', 'build-html', 'browserify-app', '_serve', 'watch']);
gulp.task('build', ['clean', 'cname', 'build-data', 'build-img', 'build-css', 'build-html', 'browserify-app', 'uglify']);
gulp.task('deploy', ['build', 'deploy-gh-pages']);
gulp.task('default', taskListing);
