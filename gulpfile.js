////
//// Usage: node ./node_modules/.bin/gulp build, clean, etc.
////
//// Life is easier if you have "./node_modules/.bin" in your path.
////

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var jsoncombine = require("gulp-jsoncombine");
var del = require('del');
var jsyaml = require('js-yaml');
var fs = require('fs');
var us = require('underscore');
var map = require('map-stream');
var shell = require('gulp-shell');
var download = require("gulp-download");


var paths = {
    // tests: ['tests/*.test.js'],
    // docable: ['lib/*.js']
    yaml_confs: ['conf/monarch-team.yaml'],
    tab_confs: ['conf/golr-views/single-tab/*yaml'],
    golr_confs: ['conf/golr-views/*yaml'],
    tab_tmp: 'conf/tmp/tab/*json',
    schema_ref: 'conf/tmp/oban-config.json'
};


gulp.task('set_up', ['make-tmp-dir']);
gulp.task('assemble', ['yaml-confs-to-json', 'download-phenopacket-schema']);
gulp.task('make-golr-conf', ['golr-tab-to-json', 'golr-yaml-to-json', 'golr-json-merge', 'golr-json-cat']);
gulp.task('tear_down', ['rm-tmp-dir']);


// Micro gulp plugin for turning streamed YAML files to JSON files.
var yaml_to_json = function yaml_to_json(file, cb){
    var nfile = file; // pass-through copy
    if (!fs.existsSync(nfile.path) ){
	// Doesn't exist, skip?
    } else {
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

/* Utility function that takes a list of objects and creates a single object where
 * the id property becomes the top level property where the list is the value
 * 
 * 
 * For example
 * [ 
 *   {
 *     id: foo
 *     description: bar
 *   },
 *   {
 *     id: baz
 *     description: qux
 *   }
 * ]
 * Becomes
 * { 
 *   foo: {id: foo, description: bar},
 *   baz: {id: baz, description: qux}
 * }
 */
var _list_to_object = function (list){
    var obj = {}
    list.forEach( function (elt) {
        if ('id' in elt){
            obj[elt['id']] = elt
        }
    });
    return obj;
}

/* Shallow merging of two objects
 * _merge_objects merges at the first level of properties
 * and then merges the field lists (of objects)
 */
var _merge_objects = function (query, reference){
    var query_keys = Object.keys(query);
    var ref_keys = Object.keys(reference);
    var merged_object = {};
    
    //Iterate through and merge 
    query_keys.forEach( function (i) {
        merged_object[i] = query[i];
    });
    
    ref_keys.forEach( function (i) {
        if (! (i in merged_object) ) {
            merged_object[i] = reference[i];
        }
    });
    
    //Merge reference field list
    reference['fields'].forEach( function (field) {
        var is_in_field = false;

        if ('id' in field) {
            query['fields'].forEach( function (query_field) {
                if (query_field['id'] === field['id']) {
                    is_in_field = true;
                }
            });
            
            if (!is_in_field) {
                merged_object['fields'].push(field)
            }
        }
    });
    return merged_object;
    
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
                                      'mkdir ./conf/tmp/tab']));

//Converts tab yaml conf stubs to json
gulp.task('golr-tab-to-json', ['make-tmp-dir'], function() {
    return gulp.src(paths.tab_confs) // for every YAML file
        .pipe(map(yaml_to_json)) // convert to JSON contents
        .pipe(rename(function(path){ // x-form to JSON extension
            path.extname = ".json";
         }))
        .pipe(gulp.dest('./conf/tmp/tab')); // write back to conf dir
});

//Converts full schemas
gulp.task('golr-yaml-to-json', ['make-tmp-dir'], function() {
    return gulp.src(paths.golr_confs) // for every YAML file
        .pipe(map(yaml_to_json)) // convert to JSON contents
        .pipe(rename(function(path){ // x-form to JSON extension
            path.extname = ".json";
         }))
        .pipe(gulp.dest('./conf/tmp/')); // write back to conf dir
});

// Merge tab files and oban schema, could be replaced with a gulp
// module such as  gulp-merge-json
gulp.task('golr-json-merge',['golr-yaml-to-json', 'golr-tab-to-json'], function() {
    //open reference file
    var reference = fs.readFileSync(paths.schema_ref);
    try {
        var ref_json = JSON.parse(reference);
    } catch (e) {
        console.log(e);
    }
    return gulp.src(paths.tab_tmp)
        .pipe(map( function (i, cb){
            var jsondoc = fs.readFileSync(i.path, 'utf8');
            try {
                var query_json = JSON.parse(jsondoc);
            } catch (e) {
                console.log(e);
            }
            var merged_obj = _merge_objects(query_json, ref_json);
            var nfile = i.clone();
            nfile.contents = new Buffer(JSON.stringify(merged_obj));
            cb(null, nfile);
        }))
        .pipe(gulp.dest('./conf/tmp/'));
});

// Cat JSON objects into one large object and write out
gulp.task('golr-json-cat',['golr-json-merge'], function() {
    return gulp.src('./conf/tmp/*json')
       .pipe(jsoncombine('golr-conf.json', function(data){
           var golr_conf = {};
           Object.keys(data).forEach(function(i) {
                var id = data[i]["id"];
                golr_conf[id] = data[i];
                golr_conf[id]['fields_hash'] = _list_to_object(golr_conf[id]['fields']);
           });
           return new Buffer(JSON.stringify(golr_conf));
       }))
       .pipe(gulp.dest('./conf/'));
});

gulp.task('download-phenopacket-schema', function() {
    var url = "https://raw.githubusercontent.com/phenopackets/" +
    		  "phenopacket-format/master/schema/phenopacket-schema.json";
    download(url)
        .pipe(gulp.dest("./tests/resources/"));
});

//Remove temp directory
gulp.task('rm-tmp-dir',['golr-json-cat'], shell.task('rm -rf ./conf/tmp'));

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['build']);

//Build (currently everything)
gulp.task('build', ['set_up', 'assemble', 'make-golr-conf', 'tear_down']);
