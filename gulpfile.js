////
//// Usage: node ./node_modules/.bin/gulp build, clean, etc.
////
//// Life is easier if you have "./node_modules/.bin" in your path.
////

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var del = require('del');
var jsyaml = require('js-yaml');
var fs = require('fs');
var us = require('underscore');
var map = require('map-stream');
var shell = require('gulp-shell');

var paths = {
    // tests: ['tests/*.test.js'],
    // docable: ['lib/*.js']
    yaml_confs: ['conf/monarch-team.yaml'],
    tab_confs: ['conf/golr-views/single-tab/*yaml'],
    golr_confs: ['conf/golr-views/*yaml']
};


gulp.task('set_up', ['make-tmp-dir']);
gulp.task('assemble', ['yaml-confs-to-json']);
gulp.task('make-golr-conf', ['golr-yaml-to-json', 'golr-json-merge', 'golr-json-cat']);
gulp.task('tear_down', ['rm-tmp-dir']);
gulp.task('tear_down', ['rm-tmp-dir']);


// Micro gulp plugin for turning streamed YAML files to JSON files.
var yaml_to_json = function yaml_to_json(file, cb){
    var nfile = file; // pass-through copy
    if (!fs.existsSync(nfile.path) ){
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

// Browser runtime environment construction.
gulp.task('yaml-confs-to-json', function() {
    return gulp.src(paths.yaml_confs) // for every YAML file
	.pipe(map(yaml_to_json)) // convert to JSON contents
	.pipe(rename(function(path){ // x-form to JSON extension
	    path.extname = ".json";
	}))
	.pipe(gulp.dest('./conf/')); // write back to conf dir
});


// Make temp directory
gulp.task('make-tmp-dir', shell.task(['mkdir ./conf/tmp',
                                      'mkdir ./conf/tmp/json',
                                      'mkdir ./conf/tmp/yaml']));

//Make golr conf
gulp.task('golr-yaml-to-json', function() {
    
});

gulp.task('golr-json-merge',['golr-yaml-to-json'], function() {
    
});

gulp.task('golr-json-cat',['golr-json-merge'], function() {
    
});

//Remove temp directory
gulp.task('rm-tmp-dir',['make-tmp-dir'], shell.task('rm -rf ./conf/tmp'));


// The default task (called when you run `gulp` from cli)
//gulp.task('default', ['watch', 'scripts', 'images']);
gulp.task('default', ['set_up', 'assemble', 'make-golr-conf', 'tear_down']);
