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

var paths = {
    // tests: ['tests/*.test.js'],
    // docable: ['lib/*.js']
    yaml_confs: ['conf/monarch-team.yaml']
};

gulp.task('assemble', ['yaml-confs-to-json']);

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


// The default task (called when you run `gulp` from cli)
//gulp.task('default', ['watch', 'scripts', 'images']);
gulp.task('default', ['assemble']);
