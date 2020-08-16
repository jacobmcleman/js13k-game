const gulp = require('gulp');
const gutil = require('gulp-util');

const lintHTML = require('gulp-htmllint');
const lintCSS = require('gulp-stylelint');
const lintJS = require('gulp-eslint');
const deleteFiles = require('gulp-rimraf');
const minifyHTML = require('gulp-minify-html');
const minifyCSS = require('gulp-clean-css');
const minifyJS = require('gulp-terser');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const replaceHTML = require('gulp-html-replace');
const imagemin = require('gulp-imagemin');
const zip = require('gulp-zip');
const checkFileSize = require('gulp-check-filesize');
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
var express = require('express')
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var tsify = require("tsify");

const paths = {
    src: {
        html: 'src/**.html',
        css: 'src/css/**.css',
        js: 'src/js/**.js',
        ts: 'src/ts/**.ts',
        images: 'src/images/**'
    },
    dist: {
        dir: 'dist',
        css: 'style.min.css',
        js: 'script.min.js',
        images: 'dist/images'
    }
};



gulp.task('compileTS', () => {
    //return tsProject
    //    .src()
    //    .pipe(tsProject())
    //    .js.pipe(gulp.dest("src/js"));

    return browserify({
        basedir: ".",
        debug: true,
        entries: ["src/ts/main.ts"],
        cache: {},
        packageCache: {}
      })
    .plugin(tsify)
    .bundle()
    .pipe(source("game.js"))
    .pipe(gulp.dest("src/js"));
});

gulp.task('lintHTML', () => {
    return gulp.src('src/**.html')
        .pipe(lintHTML());
});

gulp.task('lintCSS', () => {
    return gulp.src(paths.src.css)
        .pipe(lintCSS({
            reporters: [{ formatter: 'string', console: true }]
        }));
});

gulp.task('lintJS', () => {
    return gulp.src(paths.src.js)
        .pipe(lintJS())
        .pipe(lintJS.failAfterError());
});

gulp.task('cleanDist', () => {
    return gulp.src('dist/**/*', { read: false })
        .pipe(deleteFiles());
});

gulp.task('cleanJS', () => {
    return source("game.js")
        .pipe(deleteFiles());
});


gulp.task('buildHTML', () => {
    return gulp.src(paths.src.html)
        .pipe(replaceHTML({
            css: paths.dist.css,
            js: paths.dist.js,
        }))
        .pipe(minifyHTML())
        .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('buildCSS', () => {
    return gulp.src(paths.src.css)
        .pipe(concat(paths.dist.css))
        .pipe(minifyCSS())
        .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('buildJS', () => {
    return gulp.src(paths.src.js)
        .pipe(concat(paths.dist.js))
        .pipe(minifyJS())
        .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('optimizeImages', () => {
    return gulp.src(paths.src.images)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.dist.images));
});

gulp.task('zip', () => {
    const thirteenKb = 13 * 1024;

    gulp.src('zip/*')
        .pipe(deleteFiles());

    return gulp.src(`${paths.dist.dir}/**`)
        .pipe(zip('game.zip'))
        .pipe(gulp.dest('zip'))
        .pipe(checkFileSize({ fileSizeLimit: thirteenKb }));
});

gulp.task('cleanAll', gulp.parallel(
    'cleanDist',
    'cleanJS'
));

gulp.task('test', gulp.parallel(
    'lintHTML',
    'lintCSS',
    'lintJS'
));

gulp.task('build', gulp.series(
    'cleanDist',
    'compileTS',
    gulp.parallel('buildHTML', 'buildCSS', 'buildJS', 'optimizeImages'),
    'zip'
));

gulp.task('watch', () => {
    gulp.watch(paths.src.html, gulp.series('buildHTML', 'zip'));
    gulp.watch(paths.src.css, gulp.series('buildCSS', 'zip'));
    gulp.watch(paths.src.js, gulp.series('buildJS', 'zip'));
    gulp.watch(paths.src.images, gulp.series('optimizeImages', 'zip'));
});

gulp.task('serve', () => {
    const htdocs = paths.dist.dir;
    const app = express();
  
    app.use(express.static(htdocs));
    app.listen(3000, function() {
      gutil.log("Server started on '" + gutil.colors.green('http://localhost:3000') + "'");
    });
  });

gulp.task('serve_src', () => {
    const htdocs = src.dir;
    const app = express();
  
    app.use(express.static(htdocs));
    app.listen(3000, function() {
      gutil.log("Server started on '" + gutil.colors.green('http://localhost:3000') + "'");
    });
  });

gulp.task('default', gulp.series(
    'build',
    'watch'
));
