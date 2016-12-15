var gulp = require('gulp');
var wiredep = require('wiredep').stream;
var inject = require('gulp-inject');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var sass = require('gulp-sass');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

var browserSyncProxy = 'localhost:5000';
var paths = {
    wwwroot: 'wwwroot',
    sharedLayout: 'Views/Shared'
};

paths.js = paths.wwwroot + '/js';
paths.source = 'app';
paths.sass = paths.wwwroot + '/sass';
paths.css = paths.wwwroot + '/css';

gulp.task('default', ['serve'], function () {
    console.log('default task');
});

// run application
gulp.task('serve', ['browser-sync']);

// inject js files to _layout.cshtml
gulp.task('inject', ['typescripts', 'sass'], function () {
    var target = gulp.src(paths.source + 'index.html');
    var sources = gulp.src([paths.js + '/**/*.js'], { read: fal });

    target
        .pipe(wiredep({
            optional: 'configuration',
            goes: 'here',
            ignorePath: '../../' + paths.wwwroot + '/',
            fileTypes: {
                html: {
                    replace: {
                        js: '<script src="~/{{filePath}}"></script>'
                    }
                }
            }
        }))
        .pipe(inject(sources, {
            addRootSlash: false,
            transform: function (filePath, file, i, length) {
                if (filePath.indexOf('.min.') > -1) {
                    return null;
                }
                var newPath = filePath.replace(paths.wwwroot, '~');
                return '<script src="' + newPath + '"></script>';
            }
        })).pipe(gulp.dest(paths.sharedLayout));
});

// watch changes then inject style changed and reload browser
gulp.task('browser-sync', function () {
    browserSync.init({
        injectChanges: true,
        // proxy: browserSyncProxy,
        port: 3000,
        files: [paths.css + '/**/*.css', paths.js + "/**/*.js", paths.app + "index.html"],
        server: {
            baseDir: paths.source
        }
    });

    gulp.watch(paths.sass + '/**/*.scss', ['sass']);
    gulp.watch(paths.source + '/**/*.ts', ['typescripts-reload']);
    gulp.watch(paths.source + '/**/*.html').on('change', reload);
});

// complie sass
gulp.task('sass', function () {
    return gulp.src(paths.sass + '/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.css))
        //inject style into browser
        .pipe(browserSync.stream({ match: paths.css + '/**/*.css' }));
});

// watch sass independence
gulp.task('sass:watch', function () {
    gulp.watch(paths.sass + '/**/*.scss', ['sass']);
});

// compile typescripts
var tsProject = ts.createProject({
    declaration: true,
    module: 'commonjs',
    target: 'es5',
    sourceMap: true,
    noImplicitAny: false,
    removeComments: false
});

gulp.task('typescripts', function () {
    var tsResult = gulp.src([paths.source + '/**/*.ts', 'typings/**/*.d.ts'])
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    console.log(paths.js);
    return tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(paths.js));
});

gulp.task('typescripts:watch', ['typescripts'], function () {
    gulp.watch(paths.source + '/**/*.ts', ['typescripts']);
});

gulp.task('typescripts-reload', ['typescripts'], function () {
    reload();
});