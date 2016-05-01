var gulp = require('gulp'),
    // general
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    copy = require('gulp-copy'),
    rename = require('gulp-rename'),
    rimraf = require('gulp-rimraf'),
    ignore = require('gulp-ignore'),
    filter = require('gulp-filter'),
    sourcemaps = require('gulp-sourcemaps'),
    es = require('event-stream'),
    notify = require('gulp-notify'),
    plumber = require('gulp-plumber'),
    watchify = require('watchify'),
    stream = require('stream'),
    // sass
    sass = require('gulp-sass'),
    prefixer = require('gulp-autoprefixer'),
    uglifyCSS = require('gulp-uglifycss'),
    // jade
    jade = require('gulp-jade'),
    // minifyHTML = require('gulp-minify-html'),
    // js
    browserify = require('browserify'),
    eslint = require('gulp-eslint'),
    uglify = require('gulp-uglify'),
    // server
    nodemon = require('gulp-nodemon'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;


// DEV TASKS

gulp.task('sass', function() {
    return gulp.src('sass/main.sass')
        .pipe(plumber({
            errorHandler: notify.onError('SASS Error: <%= error.message %>')
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({
            paths: ['sass']
        }))
        .pipe(prefixer('last 2 versions'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./css/'))
        .pipe(filter('**/*.css'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('jade', function() {
    return gulp.src('jade/pages/**/*.jade')
        .pipe(plumber({
            errorHandler: notify.onError('Jade Error: <%= error.message %>')
        }))
        .pipe(jade({
            pretty: true
        }))
        .pipe(gulp.dest('views'))
        .pipe(filter('**/*.html'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('lint', function(){
    return gulp.src(['./js/src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task('js', function() {

    var files = ['./js/src/main.js', './js/src/intro/intro-main.js'];

    var errorHandler = function() {
        var args = Array.prototype.slice.call(arguments);
        notify.onError({
            title: 'JS Error',
            message: '<%= error.message %>'
        }).apply(this, args);
        this.emit('end');
    };

    var tasks = files.map(function(entry) {

        var bundler = watchify(browserify({
            entries: [entry],
            cache: {},
            packageCache: {},
            fullPaths: true,
            debug: true
        }));

        bundler.transform('browserify-shader');

        var rebundle = function() {
            return bundler.bundle()
                .on('error', errorHandler)
                .pipe(source(entry))
                .pipe(buffer())
                .pipe(sourcemaps.init({
                    loadMaps: true
                }))
                .pipe(rename({
                    extname: '.output.js',
                    dirname: ''
                }))
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest('./js/dist/'))
                .pipe(reload({
                    stream: true
                }));
        };

        bundler.on('update', rebundle);

        return rebundle();

    });

    return es.merge.apply(null, tasks);
});

gulp.task('server', function(cb) {
    var called = false;
    nodemon({
        script: 'server.js',
        watch: ['./*']
    }).on('start', function() {
        if (!called) {
            called = true;
            cb();
        }
    });
});

gulp.task('browser-sync', ['server'], function() {
    browserSync({
        proxy: 'localhost:3000',
        port: 4000,
        open: false,
        notify: false
    });
});

gulp.task('default', ['lint', 'js', 'jade', 'sass', 'browser-sync'], function() {
    // watch files
    gulp.watch('./sass/**/*.sass', ['sass']);
    gulp.watch('./jade/**/*.jade', ['jade']);
    gulp.watch('./js/**/*.js', ['lint']);
});

// BUILD TASKS - need a re-think

gulp.task('clean', function() {
    return gulp.src('./rel/*', { read: false })
        .pipe(rimraf());
});

// needs exclusions added 
gulp.task('copy', ['clean', 'jade'], function() {
    var files = [
        './img/**/*.*',
        './views/**/*.*',
        './fonts/**/*.*',
        './hype/**/*.*',
        './lib/**/*.*',
        'favicon.ico'
    ];

    return gulp.src(files, { base: './' })
        .pipe(gulp.dest('rel'));
});

gulp.task('js-rel', ['copy'], function() {

    var files = ['./js/src/main.js', './js/src/intro/intro-main.js'];

    var tasks = files.map(function(entry) {
        var task = browserify({
            entries: [entry],
            cache: {},
            packageCache: {},
            fullPaths: true
        })
        .bundle()
        .pipe(source(entry))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(rename({
            extname: '.output.js',
            dirname: ''
        }))
        .pipe(gulp.dest('./rel/js/dist/'));

        return task;
    });

    return es.merge.apply(null, tasks);
});

gulp.task('sass-rel', ['copy'], function() {
    return gulp.src('sass/main.sass')
        .pipe(sass({
            paths: ['sass']
        }))
        .pipe(prefixer('last 2 versions'))
        // .pipe(uglifyCSS())
        .pipe(gulp.dest('./rel/css/'))
        .pipe(filter('**/*.css'));
});

gulp.task('build', ['jade', 'clean', 'copy', 'js-rel', 'sass-rel'], function() {});