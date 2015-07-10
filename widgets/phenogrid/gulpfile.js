////
//// Usage: node ./node_modules/.bin/gulp <TARGET>
//// Current top targets:
////  - bundle: create the distribution files
////  - docs: create the API documentation and put it into docs/
////  - tests: run the unit tests
//// Watch targets:
////  - watch-tests: run tests on changes to source files
////  - watch-docs: build doc on changes to source files
////

var gulp = require('gulp');
//var jsdoc = require('gulp-jsdoc');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var rename = require("gulp-rename");
var mocha = require('gulp-mocha');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var bump = require('gulp-bump');
var del = require('del');
var shell = require('gulp-shell');

var paths = {
    readme: ['./README.md'],
    tests: ['tests/*.test.js', 'tests/*.tests.js'],
    docable: ['js/*.js', './README.md'],
    transients:['./docs/*', '!./docs/README.org']
};

// The default task is to build the different distributions.
gulp.task('bundle', ['browserify-byo', 'create-bundle']);

// Bundle together 
gulp.task('browserify-byo', function(cb) {
    browserify('./js/phenogrid.js')
	.bundle()
        .pipe(source('./js/phenogrid.js'))
	.pipe(rename('phenogrid-byo.js'))
	.pipe(gulp.dest('./dist/'))
	.on('end', cb);
});

// Cat on the used jquery to the bundle.
gulp.task('create-bundle', ['browserify-byo'], function() {
    var pkg = require('./package.json');
    var jq_path = pkg['browser']['jquery'];
    //var jqui_path = pkg['browser']['jquery-ui'];
    gulp.src([jq_path, 'dist/phenogrid-byo.js'])
    //gulp.src(['./dist/phenogrid-byo.js'])
	.pipe(concat('phenogrid-bundle.js'))
	.pipe(gulp.dest('./dist/'));
});

// Browser runtime environment construction.
gulp.task('build', ['bundle', 'patch-bump', 'docs']);

gulp.task('patch-bump', function(cb){
    gulp.src('./package.json')
	.pipe(bump({type: 'patch'}))
	.pipe(gulp.dest('./'));
    cb(null);
});

gulp.task('minor-bump', function(cb){
    gulp.src('./package.json')
	.pipe(bump({type: 'minor'}))
	.pipe(gulp.dest('./'));
    cb(null);
});

gulp.task('major-bump', function(cb){
    gulp.src('./package.json')
	.pipe(bump({type: 'major'}))
	.pipe(gulp.dest('./'));
    cb(null);
});

// Build docs directory with JSDoc.
gulp.task('docs', ['jsdoc']);

// Build docs directory with JSDoc.
// Completely dependent on clean before running doc.
// gulp.task('jsdoc', ['clean'], function(cb) {
//     gulp.src(paths.docable, paths.readme)
//         .pipe(jsdoc('./doc'));
//     cb(null);
// });
// TODO: Ugh--do this manually until gulp-jsdoc gets its act together.
gulp.task('jsdoc', ['clean'], function(cb) {
    gulp.src('')
        .pipe(shell([
	    './node_modules/.bin/jsdoc --verbose --template ./node_modules/jsdoc-baseline --readme ./README.md --destination ./docs/ ./js/*.js'
	]));
    cb(null);
});

// Get rid of anything that is transient.
gulp.task('clean', function(cb) {
    del(paths.transients);
    cb(null);
});

// Testing with mocha/chai.
gulp.task('tests', function() {
    return gulp.src(paths.tests, { read: false }).pipe(mocha({
	reporter: 'spec',
	globals: {
	    // Use a different should.
	    should: require('chai').should()
	}
    }));
});

gulp.task('release', ['build', 'publish-npm']);

// Needs to have ""
gulp.task('publish-npm', function() {
    var npm = require("npm");
    npm.load(function (er, npm) {
	// NPM
	npm.commands.publish();	
    });
});

// Rerun doc build when a file changes.
gulp.task('watch-docs', function() {
  gulp.watch(paths.docable, ['docs']);
  gulp.watch(paths.readme, ['docs']);
});

// Rerun doc build when a file changes.
gulp.task('watch-tests', function() {
  gulp.watch(paths.docable, ['tests', 'bundle']);
  gulp.watch(paths.tests, ['tests', 'bundle']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', function() {
    console.log("'allo 'allo!");
});
