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
var jsdoc = require('gulp-jsdoc');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var rename = require("gulp-rename");
var mocha = require('gulp-mocha');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var bump = require('gulp-bump');
var del = require('del');
var shell = require('gulp-shell');
var jsyaml = require('js-yaml');
var fs = require('fs');
var us = require('underscore');
var map = require('map-stream');

var paths = {
    readme: ['./README.md'],
    tests: ['tests/*.test.js', 'tests/*.tests.js'],
    docable: ['js/*.js', './README.md'],
    transients:['./docs/*', '!./docs/README.org'],

    yaml_confs: ['conf/monarch-team.yaml']
};

gulp.task('assemble', ['yaml-confs-to-json']);

// Bundle together
gulp.task('build', ['install-phenogrid'], function(cb) {
    browserify('./js/monarch-index.js')
    .bundle()
    .pipe(source('./js/monarch-index.js'))
    .pipe(rename('monarch-bundle.js'))
    .pipe(gulp.dest('./dist/'))
    .on('end', cb);
});

// Copy non-bundled phenogrid assets
gulp.task('install-phenogrid', function(cb) {
    // gulp.src('node_modules/local-phenogrid/dist/**/*')
    // .pipe(gulp.dest('./dist/phenogrid/'));

    // gulp.src('node_modules/local-phenogrid/css/**/*')
    // .pipe(gulp.dest('./dist/phenogrid/css'));

    // gulp.src('node_modules/local-phenogrid/config/**/*')
    // .pipe(gulp.dest('./dist/phenogrid/config'));

    // gulp.src('node_modules/local-phenogrid/image/**/*')
    // .pipe(gulp.dest('./dist/phenogrid/image'));

    // gulp.src('node_modules/local-phenogrid/js/**/*')
    // .pipe(gulp.dest('./dist/phenogrid/js'));

    // gulp.src('node_modules/local-phenogrid/index.html')
    // .pipe(gulp.dest('./dist/phenogrid'));
});


// Micro gulp plugin for turning streamed YAML files to JSON files.
var yaml_to_json = function yaml_to_json(file, cb){
    var nfile = file; // pass-through copy
    if( ! fs.existsSync(nfile.path) ){
    // Doesn't exist, skip?
    }else{
    try {
        // YAML to JSON.
        var jsondoc = jsyaml.safeLoad(fs.readFileSync(file.path, 'utf8'));
        // Deep-copy everything over.
        nfile = file.clone();
        // But override the contents with the new (readable) JSON.
        nfile.contents = new Buffer(JSON.stringify(jsondoc, null, "  "));
        //console.log(jsondoc);
    } catch (e) { console.log(e); }
    }

    cb(null, nfile);
};

gulp.task('yaml-confs-to-json', function() {
    return gulp.src(paths.yaml_confs) // for every YAML file
    .pipe(map(yaml_to_json)) // convert to JSON contents
    .pipe(rename(function(path){ // x-form to JSON extension
        path.extname = ".json"
    }))
    .pipe(gulp.dest('./conf/')); // write back to conf dir
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
gulp.task('default', ['assemble']);
