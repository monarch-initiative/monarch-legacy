 /*

   Monarch WebApp

  See the RingoJS and Stick documentation for details on the approach.

  After some helper functions are declared, this consists of mappings of URL patterns to queries + visualization

 */

var stick = require('stick');
var Mustache = require('mustache');
var fs = require('fs');
var response = require('ringo/jsgi/response');

var httpclient = require('ringo/httpclient');
var http = require('ringo/utils/http');
var file = require('ringo/utils/files');
var strings = require('ringo/utils/strings');

var pup_tent = require('pup-tent')(['js','css','templates','templates/labs', 'templates/legacy',
                                    'templates/page',
                                    'widgets/datagraph/js',
                                    'widgets/datagraph/css',
                                    'widgets/phenogrid/js',
                                    'widgets/phenogrid/css',
                                    'widgets/keggerator/js',
                                    'widgets/class-enrichment',
                                    'conf' // get access to conf/golr-conf.json
                                    ]);

// Setup a little information capturing.
var reporter = require('pup-analytics')();

var app = exports.app = new stick.Application();
app.configure('route');
app.configure('params');
app.configure('static');

app.configure(require('./sanitize'));
app.configure(require('./cors-middleware.js'));

var {isFileUpload, TempFileFactory, mergeParameter,
    BufferFactory, getMimeParameter, Headers} = require("ringo/utils/http");

/* Here we are overriding the upload function from stick's upload.js module
 * The stick module is hardcoded to use a BufferFactory for uploads, resulting
 * in large files causing memory issues.  Here we override the function using
 * a TempFileFactory from ringo/utils/http.js.  This streams the data into a 
 * temp file using the servers default tmp directory.  
 * 
 * We also set a limit of 50 mb by checking the content-length in
 * HTTP Header and override the parseFileUpload function to support a 
 * streaming limit as well.
 */

// Custom upload function to upload files to tmp file
// Set upload limit to <50 MB using content-length from HTTP Header
// Set streaming limit to <60 MB in case the content-length is incorrect
app.configure (function upload(next, app) {

    app.upload = {
        impl: TempFileFactory
    };

    return function upload(req) {

        var postParams, desc = Object.getOwnPropertyDescriptor(req, "postParams");

        /**
         * An object containing the parsed HTTP POST parameters sent with this request.
         * @name request.postParams
         */
        Object.defineProperty(req, "postParams", {
            get: function() {
                if (!postParams) {
                    var contentType = req.env.servletRequest.getContentType();
                    if (req.headers['content-length'] > 50000000){
                        postParams = {};
                        postParams.file_exceeds = req.headers['content-length'];
                    } else if ((req.method === "POST" || req.method === "PUT")
                            && isFileUpload(contentType)) {
                        postParams = {};
                        var encoding = req.env.servletRequest.getCharacterEncoding();
                        var byte_limit = 60000000;
                        parseFileUploadWithLimit(this, postParams, encoding, TempFileFactory, byte_limit);
                    } else if (desc) {
                        postParams = desc.get ? desc.get.apply(req) : desc.value;
                    }
                }
                return postParams;
            }, configurable: true
        });

        return next(req);
    };
});

//app.static("docs", "index.html", "/docs");

//Configure pup tent common css and js libs
pup_tent.set_common('css_libs', [
    '/bootstrap.min.css',
    '/monarch-common.css',
    '/stickytooltip.css',
    '/jquery-ui.css']);
pup_tent.set_common('js_libs', [
    '/underscore-min.js',
    '/jquery-1.11.0.min.js',
    '/jquery-ui-1.10.3.custom.min.js',
    '/bootstrap.min.js',
    '/d3.min.js',
    '/search_form.js',
    '/tabs.js',
    '/monarch-common.js',
    '/monarch.js',
    '/jquery.cookie.js',
    '/jquery.xml2json.js']);

//note: in future this may conform to CommonJS and be 'require'd
var engine = new bbop.monarch.Engine();

// The kinds of types that we're likely to see.
var js_re = /\.js$/;
var css_re = /\.css$/;
var json_re = /\.json$/;
var html_re = /\.html$/;
function _decide_content_type(thing){
    var ctype = null;
    if( js_re.test(thing) ){
	ctype = 'text/javascript';
    }else if( css_re.test(thing) ){
	ctype = 'text/css';
    }else if( json_re.test(thing) ){
        ctype = 'application/json';
    }else if( html_re.test(thing) ){
	ctype = 'text/html';
    }else{
	// "Unknown" type.
	ctype = 'application/octet-stream';
    }
    return ctype;
}
function _return_mapped_content(loc){
    var ctype = _decide_content_type(loc);
    var str_rep = fs.read(loc);
    return {
	body: [str_rep],
	headers: {'Content-Type': ctype},
	status: 200
    };
}

// Add routes for all static cache items at top-level.
pup_tent.cached_list().forEach(
    function(thing){
        // This will skip cached templates.
        var ctype = _decide_content_type(thing);
        if( ctype !== null ){
            app.get('/' + thing,
                function(req, page) {
                return {
                      body: [pup_tent.get(thing)],
                      headers: {'Content-Type': ctype},
                      status: 200
                  };
                });
        }
});
// When not in production, re-read files from disk--makes development
// easier.
if( ! engine.isProduction() ){
    pup_tent.use_cache_p(false);
}

// note: this will probably move to it's own OO module
engine.cache = {
    fetch: function(tbl, key, val) {
        var path = "./cache/"+tbl+"/key-"+key+".json";
        //console.log("R lookup:"+path);
        if (fs.exists(path)) {
            //console.log("Using cached for:"+key);
            return JSON.parse(fs.read(path));
        }
        return null;
    },
    store: function(tbl, key, val) {
        var path = "./cache/"+tbl+"/key-"+key+".json";
        //console.log("S lookup:"+path);
        fs.write(path, JSON.stringify(val));
    },
    clear: function(match) {
        var files = fs.listTree("cache");
        for (var i=0; i<files.length; i++) {
            var file = files[i];
            console.log("T:"+file);
            if (file.indexOf("key-") > 0 &&
                file.indexOf(".json") > 0) {
                if (match != null && file.indexOf(match) == -1) {
                    // does not match specified key
                }
                else {
                    console.log("CLEARING: " + file);
                    fs.remove("./cache/" + file);
                }
            }
        }
    },
    sizeInfo: function() {
        var subprocess = require("ringo/subprocess");
        console.log("Getting sizeInfo for "+this.cacheDirs());
        var info =
            this.cacheDirs().map(function(dir) {
                console.log("Testing: "+dir);
                return { id : dir,
                         entries : fs.listTree("cache/"+dir).filter(function(f){ return f.indexOf(".json") > 0}).length,
                         sizeOnfo : subprocess.command("du -sh cache/"+dir)
                       };
            });
        console.log("Got: "+info.length);
        return info;
    },
    cacheDirs: function() {
        return fs.listDirectoryTree("cache").filter(function(f){ return f.length > 0 });
        //return fs.listTree("cache").filter(function(f){ return fs.isDirectory(f)});
    },
    contents: function() {
        return fs.listTree("cache").filter(function(f){ return f.indexOf(".json") > 0});
    }
};

// STATIC HELPER FUNCTIONS. May become OO later.
//o Deprecated with Pup tent
function getTemplate(t) {
    var s = fs.read('templates/'+t+'.mustache');
    return s;
}

function getConfig(t) {
    var s = JSON.parse(fs.read('conf/'+t+'.json'));
    return s;
}

function staticTemplate(t) {
    var info = {};
    addCoreRenderers(info);
    info.pup_tent_css_libraries.push("/monarch-main.css");
    var output = pup_tent.render(t+'.mustache',info);
    return response.html(output);
    //return response.html(Mustache.to_html(getTemplate(t), info));
}

function prepLandingPage() {
  // Rendering.
  var info = {};
  addCoreRenderers(info);
  info.pup_tent_css_libraries.push("/monarch-landing.css");
  return info;
}

function loadBlogData(category, lim) {
  // Get blog data and render with vars.
  var blog_res = _get_blog_data(category);
  // Limit to X.
  var lim = 4;
  if (blog_res && blog_res.length > lim ) {
    blog_res = blog_res.slice(0, lim);
  }
  return blog_res;
}

function (loc,page,ctype) {
    var s = fs.read(loc+'/'+page);
    return {
      body: [Mustache.to_html(s,{})],
      headers: {'Content-Type': ctype},
      status: 200
   };
}

// This function takes a json representation of some data
// (for example, a disease and various associated genes, phenotypes)
// intended to be rendered by some template (e.g. disease.mustache) and
// adds additional functions or data to be used in the template.
function addCoreRenderers(info, type, id){

    // Initialize info
    if( ! info ){ info = {}; }

    // Standard context.
    info['@context'] = "/conf/monarch-context.json";

    // Add standard pup-tent variables.
    info.pup_tent_css_libraries = [];
    info.pup_tent_js_libraries = [];
    info.pup_tent_js_variables = [];

    // Add default monarch layout controls.
    info.monarch_nav_search_p = true;
    info.monarch_extra_footer_p = false;

    // JS launcher.
    info.monarch_launchable = [];
    
    // Other controls.
    info.alerts = [];
    info.scripts = [];
    info.stylesheets = [];
    /*info.scripts = [
        {"url" : "/js/jquery-1.11.0.min.js"},
        {"url" : "/js/jquery-ui-1.10.3.custom.min.js"},
        {"url" : "/js/bootstrap.min.js"},
        {"url" : "/js/d3.min.js"},
        {"url" : "/js/search.js"},
        {"url" : "/js/tabs.js"},
        {"url" : "/js/monarch-common.js"},
        {"url" : "/js/jquery.xml2json.js"}

    ];
    info.stylesheets = [
        {"url" : "/css/bootstrap.min.css"},
        {"url" : "/css/monarch-common.css"},
        {"url" : "/css/jquery-ui.css"}
    ];*/
    if (id != null) {
        info.base_url = "/"+type+"/"+id;
        info.download = {
            "json" : genURL(type, id, 'json')
        };
        //console.log("DN:"+JSON.stringify(info.download));
    }

    // Add global CSS.
    info.css = {};
    // info.css.table = "table table-striped table-condensed";

    // Add parsed conf files from /conf if not already in.
    if( info['conf'] == null ){ info['conf'] = {}; }
    if( info['conf']['monarch-team'] == null ){
	// Read in conf/monarch-team.json.
	info['conf']['monarch-team'] =
	    JSON.parse(fs.read('./conf/monarch-team.json'));
    }

    if (info.relationships != null) {
        var fragmentId = engine.getOntoquestNifId(id);
        var superClasses = [];
        var subClasses = [];
        var equivalentClasses = [];
        for (var k in info.relationships) {
            var rel = info.relationships[k];
            var propId = rel.property.id;
            if (propId == 'equivalentClass') {
                if (id == rel.subject.id){
                    equivalentClasses.push(rel.object);
                }
                else if (id == rel.object.id) {
                    equivalentClasses.push(rel.subject);
                }
                else {
                    console.error("Logic error: "+JSON.stringify(rel));
                }
            }
        }
        // The concept of node is taken from the OWLAPI; a node
        // is a set of classes that are mutually equivalent
        var node = equivalentClasses.map(function(c){return c.id}).concat(id);

        for (var k in info.relationships) {
            var rel = info.relationships[k];
            var propId = rel.property.id;
            if (propId == 'subClassOf' || propId == 'BFO_0000050') {
                if (node.indexOf( rel.subject.id ) > -1){
                    superClasses.push(rel.object);
                }
                else if (node.indexOf( rel.object.id ) > -1){
                    subClasses.push(rel.subject);
                }
                else {
                    // this state should be impossible when OQ bug is fixed
                    console.error("Logic error: "+rel);
                }
            }
        }
        info.superClasses = superClasses.map(function(c){return genObjectHref(type,c)});
        info.subClasses = subClasses.map(function(c){return genObjectHref(type,c)});
        info.equivalentClasses = equivalentClasses.map(function(c){return genObjectHref(type,c)+" ("+c.id+")"});
    }
    info.includes = {};
    var alys_id = engine.config.analytics_id || null;
    info.includes.analytics = Mustache.to_html(getTemplate('analytics'),
                           {'analytics_id': alys_id});
    info.includes.navbar = Mustache.to_html(getTemplate('navbar'), {});
    info.includes.footer = Mustache.to_html(getTemplate('footer'), {});
    info.includes.classificationComponent = Mustache.to_html(getTemplate('classificationComponent'), info);

    info.isProduction = engine.config.type == 'production';

    info.alerts = info.alerts.concat(getConfig('alerts'));
    if (!info.isProduction) {
        var prodUrlSuffix = (id == null ? "" : genURL(type, id));
        var prodUrl = "http://monarchinitiative.org" + prodUrlSuffix;
        var legacyUrl = "/legacy" + prodUrlSuffix;
        info.alerts.push("This is the beta interface. <a href='"+prodUrl+"'>View this page on the main portal</a>.");
        info.alerts.push("Alpha testing of new interface. <a href='"+legacyUrl+"'>View legacy URL on beta</a>.");
    }
}


// adds js and other files required for phenogrid
function addPhenogridFiles(info) {
    info.pup_tent_js_libraries.push("/keggerator.js");
    info.pup_tent_js_libraries.push("/phenogrid_config.js");
    info.pup_tent_js_libraries.push("/phenogrid.js");
    info.pup_tent_js_libraries.push("/jshashtable.js");
    info.pup_tent_js_libraries.push("/stickytooltip.js");
    info.pup_tent_js_libraries.push("/render.js");
    info.pup_tent_css_libraries.push("/phenogrid.css");
}

// Takes JSON and returns an HTTP response, possibly translating
// the JSON into a requested format.
// Note that HTML is handled separately.
function formattedResults(info, fmt,request) {
    if (fmt == 'json') {
        return response.json(info);
    }
    if (fmt == 'text') {
        return response.text(info);
    }
    if (fmt == 'jsonp') {
    // get callback name from parameters and wrap it around
    //response.
    /// consider replacing with response.jsonp once we got to
    //ringo .10
    var qs = request.queryString;
    var params = http.parseParameters(qs);
    callback = params.callback;
    var resp  = callback+"("+JSON.stringify(info)+");";
    return {
        status: 200,
        headers: {"Content-Type": "application/json"},
        body: [resp]
    };
    }
    else if (fmt == 'rdf' || fmt == 'nt') {
        // prepare  POST request to JSON-LD ==> RDF translator
        // (in future we may do this ourselves)
        var ct = 'text/plain';
        //var ct = 'application/n-triples';
        var tgt = fmt;
        if (fmt == 'rdf') {
            tgt = 'xml';
            ct = 'application/rdf+xml';
        }
        var url = "http://rdf-translator.appspot.com/convert/json-ld/"+tgt+"/content";
        var jsonStr = JSON.stringify(info);
        var rdf = httpclient.post(url, {content:jsonStr}).content;
        return {
            body: [rdf],
            headers: {'Content-Type': ct},
            status: 200
        };
    }
    else {
        return {
            body: [ "Cannot handle format/extension: "+fmt],
            status: 500
        };
    }
}

function errorResponse(msg) {
    var info = {};
    addCoreRenderers(info);
    //print(JSON.stringify(msg));
    console.error("Throwing error:" + msg);
    for (var k in msg) {
        console.warn("  :"+k+"="+msg[k]);
    }
    var stm = require("ringo/logging").getScriptStack(msg);
    console.error("Stack trace="+stm);
    //info.message = JSON.stringify(msg, null, ' ');
    info.stackTrace = stm;
    info.message = msg.message;
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.title = 'Error';
    var output = pup_tent.render('notfound.mustache',info,'monarch_base.mustache');
    var res =  response.html(output);
    //var res = response.html(Mustache.to_html(getTemplate('error'),info));
    res.status = 500;
    return res;
}

function notFoundResponse(msg) {
    var info = {};
    addCoreRenderers(info);
    //print(JSON.stringify(msg));
    console.error("Throwing error:" + msg);
    for (var k in msg) {
        console.warn("  :"+k+"="+msg[k]);
    }
    var stm = require("ringo/logging").getScriptStack(msg);
    console.error("Stack trace="+stm);
    //info.message = JSON.stringify(msg, null, ' ');
    info.stackTrace = stm;
    info.message = msg.message;
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.title = 'Error';
    var output = pup_tent.render('notfound.mustache',info,'monarch_base.mustache');
    var res =  response.html(output);
    //var res = response.html(Mustache.to_html(getTemplate('error'),info));
    res.status = 404;
    return res;
}


////////////////////////////////////////
// CONTROLLER
//


/* Namespace: webapp
 *
 * Monarch REST URLs for retrieving web pages, JSON and HTML
 *
 * Each REST URL pattern has an undelrying implementation in <monarch.api>
 *
 */

/*
 * Method: /status
 *
 * Return the current state of webapp.js, including any interesting
 * analytics we might have collected (TODO).
 *
 * Parameters: 
 *  request - the incoming request object
 *
 * Returns:
 *  JSON response
 */
app.get('/status', function(request) {
    var status = {};

    status['name'] = "Monarch Application";
    status['okay'] =  true;
    status['message'] =  'okay';
    status['date'] = (new Date()).toString();
    status['location'] = request.url || '???';
    status['offerings'] = [
	{'name': 'api_version', 'value': engine.apiVersionInfo()},
	{'name': 'config_type', 'value': engine.config.type},
	{'name': 'good_robot_hits', 'value': reporter.report('robots.txt')}
    ];

    return response.json(status);
});

// Method: /
//
// Arguments:
//  - none
//
// Returns:
//  Top level page
app.get('/labs/old-home', function(request) {
    var info = {};
    addCoreRenderers(info);

    info.pup_tent_css_libraries = [
        '/monarch-main.css',
        '/main.css'
    ];
    info.title = 'Monarch Diseases and Phenotypes';
    var output = pup_tent.render('main.mustache', info, 'monarch_base.mustache');
    return response.html(output);
});

// generic template
app.get('/page/:page', function(request,page) {
    var info = {};
    addCoreRenderers(info);

    if (!(page === 'software')){
        info.pup_tent_css_libraries.push("/tour.css");
    } else {
        info.pup_tent_css_libraries.push("/monarch-main.css");
    }

    var output = pup_tent.render(page+'.mustache',info);
    return response.html(output);
});

// block unwanted access
app.get('/robots.txt', function(request,page) {
    var info = {};
    addCoreRenderers(info);
    reporter.hit('robots.txt');

    return {
        status: 200,
        headers: {"Content-Type": 'text/plain'},
        //body: [Mustache.to_html(getTemplate('page/robots'), info)]
        body: [pup_tent.apply('robots.mustache', info)]
    };
});

// anything in the docs/ directory is passed through statically
app.get('/docs/*', function(request) {
    var path = request.pathInfo;
    var ct = 'text/plain';
    if (path.indexOf(".html") > 0) {
        ct = "text/html";
    }
    if (path.indexOf(".css") > 0) {
        ct = "text/css";
    }
    return serveDirect(".", path, ct);
    //return ('docs','files/js-api.html','text/html');
});
/*
 * This seems to be broken with the puptent update
 *
 * This can probably be deprecated
 *
// CSS: pass-thru
app.get('/css/:page', function(request,page) {
    return ('css',page,'text/css');
});
// JS: pass-thru
app.get('/js/:page', function(request,page) {
   return ('js',page,'text/plain');
});
*/
// IMG: pass-thru
app.get('/image/:page', function(request,page) {
    var s = fs.read('./image/'+page, {binary:true});
    return {
      body: [s],
      headers: {'Content-Type': 'image/png'},
      status: 200
   };
});

/*
 * DEPRECATED WITH PUPTENT
 * UNDEPRECATED DUE TO PUPTENT 
 *
 *  dedicated routing of the /widgets/phenogrid was initially removed due to puptent,
 *  but this breaks phenogrid dependency on file structure.  Reinstate specific routing
 *  until such time as puptent is appropriately generalized
 */


// anything in the docs/ directory is passed through statically
app.get('/widgets/phenogrid/*', function(request) {
    var path = request.pathInfo;
    var ct = 'text/plain';
    if (path.indexOf(".html") > 0) {
    ct = "text/html";
    }
    if (path.indexOf(".css") > 0) {
    ct = "text/css";
    }
    return serveDirect(".", path, ct);
});

/* needed to retain basic functionality for pass-through end run around puptent for phenogrid.*/
function serveDirect(loc,page,ctype) {
    var s = fs.read(loc+'/'+page);
    return {
    body: [Mustache.to_html(s,{})],
    headers: {'Content-Type': ctype},
    status: 200
    };
}


//Phenogrid IMG: pass-thru
app.get('/widgets/phenogrid/image/:page', function(request,page) {
     var path = request.pathInfo;
     var ct = 'image/png';
     if (path.indexOf(".gif") > 0) {
         ct = "image/gif";
     }
     var s = fs.read('widgets/phenogrid/image/'+page, {binary:true});
     return {
       body: [s],
       headers: {'Content-Type': [ct]},
       status: 200
    };
    return serverDirect('widgets/phenogrid/image',page, ct);
});


// Method: search
//
// searches over ontology terms via SciGraph
//
// Path:
//  - /search/:term
//
// Formats:
//  - html
//  - json
//
//
// Returns:
//  All classes with :term as a substring
app.get('/search/:term?.:fmt?', function(request, term, fmt) {
    try {
        if (request.params.search_term != null) {
            term = request.params.search_term;
        }

        if (/^\s*\S+:\S+\s*$/.test(term)) {
            var url;
            engine.log("Redirecting " + term);
            var resultObj = engine.getVocabularyTermByID(term);
            //Taking the first result
            if (typeof resultObj.concepts[0] != 'undefined'){
                var type = resultObj.concepts[0].categories[0];
                var id = resultObj.concepts[0].curie;
                url = genURL(type,id);
            } else {
                //Fallback
                url = genURL('object',term);
            }
            return response.redirect(url);
        }

        // temporary fix: need to properly figure out when to encode/decode
        // See: https://github.com/monarch-initiative/monarch-app/issues/287
        term = term.replace(/&#039;/g, "'");
        var results = engine.searchOverOntologies(term);
        var info = {};
        info.results = results;
        
        if (fmt != null) {
            return formattedResults(info, fmt);
        }

        info.term=term;
        // HTML
        addCoreRenderers(info, 'search', term);

        // adorn object with rendering functions
        if (info.results.length > 0){
            info.resultsTable = function() {return genTableOfSearchResults(info.results); };
            info.description = "<span>Results for "+term+ " searching phenotypes, diseases, genes, and models</span>";
        } else {
            info.resultsTable = "<span class=\"no-results\">&nbsp;&nbsp;No results found</span>";
        }
        
        info.pup_tent_js_libraries.push("/search-results.js");
        
        info.monarch_launchable = [];
        info.pup_tent_js_variables.push.apply(info.pup_tent_js_variables,
            [
                {name:'searchTerm',value:term},
            ]);
        
        info.monarch_launchable.push('search_results_init(searchTerm);');

        info.pup_tent_css_libraries.push("/monarch-specific.css");
        info.pup_tent_css_libraries.push("/search-page.css");
        info.title = 'Search Results: '+term;

        var output = pup_tent.render('search_results.mustache',info,'monarch_base.mustache');
        return response.html(output);
    }
    catch(err) {
        return errorResponse(err);
    }

});

//Method: search over NIF
//
// searches over NIF
//
// Path:
//  - /neurosearch/:term
//
// Formats:
//  - html
//  - json
//
//
// Returns:
//  All classes with :term as a substring
app.get('/neurosearch/:term?.:fmt?', function(request, term, fmt) {
    try {
        if (request.params.search_term != null) {
            term = request.params.search_term;
        }

        if (/^\s*\S+:\S+\s*$/.test(term)) {
            engine.log("Redirecting" + term);
            return response.redirect(genURL('object',term));
        }

        // temporary fix: need to properly figure out when to encode/decode
        // See: https://github.com/monarch-initiative/monarch-app/issues/287
        term = term.replace(/&#039;/g, "'");
        var info = {};
        var otherResults = engine.searchOverData(term);

        //make associations from categorical data
        info.otherResults = [];
        Object.keys(otherResults).forEach(function (cat) {
            var obj = {};
            otherResults[cat].forEach(function(r) {
                obj = r;
                obj.category = cat;
                info.otherResults.push(obj);
            });
        });

        if (fmt != null) {
            return formattedResults(info, fmt);
        }

        info.term=term;
        // HTML
        addCoreRenderers(info, 'search', term);

        // adorn object with rendering functions
        info.genResultsTable = function() {return genTableOfSearchDataResults(info.otherResults) };


        info.pup_tent_css_libraries.push("/monarch-specific.css");
        info.pup_tent_css_libraries.push("/search-page.css");
        info.title = 'NIF Search Results: '+term;

        var output = pup_tent.render('search_results.mustache',info,'monarch_base.mustache');
        return response.html(output);
    }
    catch(err) {
        return errorResponse(err);
    }

});

//list all of the sources supplying data to monarch.
app.get('/sources.:fmt?', function(request, fmt) {
try {
        //fetch data description json
        var sources = engine.fetchDataDescriptions();
        var info = {};
        // adorn object with rendering functions
        info.sourcesTable = function() {return genTableOfDataSources(sources); };
        addCoreRenderers(info, 'sources');

        if (fmt != null) {
            return formattedResults(sources, fmt,request);
        }


        info.pup_tent_css_libraries.push("/monarch-specific.css");
        info.pup_tent_css_libraries.push("/sources.css");
        info.title = 'Data Sources';

        var output = pup_tent.render('sources.mustache',info,'monarch_base.mustache');
        return response.html(output);
    }
    catch(err) {
        return errorResponse(err);
    }


});

// Method: autocomplete
//
// proxy for vocbaulary services autocomplete
//
// Path:
//  - /autocomplete/:term
//  - /autocomplete/:category/:term
//
// Formats:
//  - html
//  - json
//
//
// Returns:
//  List of matching objects

app.get('/autocomplete/:category/:term.:fmt?',function(request,category,term,fmt) {
    // todo - we would like to normalize possible categories; e.g. phenotype --> Phenotype
    var info = engine.searchSubstring(term, category);
    // todo - DRY - reuse code from below
    //engine.log("got autocomplete results..."+info.length);
    //if (info.length > 0) { console.log("first is: "+info[0].term); }
    if (fmt != null) {
        //engine.log("format is "+fmt);
        var res= formattedResults(info,fmt,request);
        return res;
    } else {
        return {
            body: [ "Cannot handle format/extension: "+fmt],
            status: 500
        };
    }
});


app.get('/autocomplete/:term.:fmt?',function(request,term,fmt) {
    var info = engine.searchSubstring(term);
    //if (info.length > 0) { engine.log("first is: "+info[0].term); }
    if (fmt != null) {
        //console.log("format is "+fmt);
        var res= formattedResults(info,fmt,request);
        return res;
    } else {
        return {
            body: [ "Cannot handle format/extension: "+fmt],
            status: 500
        };
    }
});


// Method: disease
//
// disease info or page.
//
// This will combine multiple sources of data combining phenotype. gene, pathway etc
// data. The aggregation makes use of the ontology; e.g. the results for DOID_14330 (Parkinson's disease) will
// include info association with PD only any subtypes
//
// Implementation:
//  - <monarch.api.fetchDiseaseInfo>
//
// Paths:
//  - /disease/  (HTML only)
//  - /disease/:id (combined info about a disease)
//  - /disease/:id/:section
//
//
// Formats:
//  - html
//  - json
//
//  Examples:
//  - /disease/ (Top page)
//  - /disease/DOID_14330 (Parkinson's disease)
//  - /disease/DOID:14330 (same as above - CURIES or URI fragments may be used)
//  - /disease/DOID_14330/phenotype_associations.json (Phenotypes for Parkinson's disease, as JSON)
//
//
// Returns:
//  Disease with matching ID

app.get('/disease', function(request) {
        var info = prepLandingPage();
        info.blog_results = loadBlogData('disease-news', 4);

    info.spotlight = engine.fetchSpotlight('disease');
    //info.spotlight.link = genObjectHref('disease',{id:info.spotlight.id, label:"Explore"});
	info.spotlight.link = genObjectHref('disease',info.spotlight);

    var heritability = info.spotlight.heritability;
    info.spotlight.heritability = info.spotlight.heritability.map(function(h) {return h.label}).join(", ");

    var phenotypes = _sortByLabel(info.spotlight.phenotypes).map(function(p) genObjectHref('phenotype',p));
    info.spotlight.phenotypes = phenotypes.slice(0,5).join(", ");
    if (phenotypes.length > 5) {
        info.spotlight.phenotypes += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(phenotypes.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.phenotypes += phenotypes.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    var genes = ['(none)'];
    if (info.spotlight.genes != null && info.spotlight.genes.length > 0) {
        info.spotlight.genes = _sortByLabel(info.spotlight.genes);
        genes = info.spotlight.genes.map(function(p) genObjectHref('gene',p));
    }
 
    info.spotlight.genes = genes.slice(0,5).join(", ");
    if (genes.length > 5) {
        info.spotlight.genes += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(genes.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.genes += genes.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    
    if (info.spotlight.model_count > 0){
        info.spotlight.models = "<a href=/disease/"+info.spotlight.id+"#model>"+info.spotlight.model_count+"</a>";
    } else {
        info.spotlight.models = info.spotlight.model_count;
    }
    
    if (info.spotlight.publication_count > 0){
        info.spotlight.publications = "<a href=/disease/"+info.spotlight.id+
        "#literature>"+info.spotlight.publication_count+"</a>";
    } else {
        info.spotlight.publications = info.spotlight.publication_count;
    }
    
    //graph
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    info.pup_tent_js_libraries.push("/BarChart.js");
    info.pup_tent_js_libraries.push("/graph_config.js");
    var disPhenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-disease-phenotype-distro.json'));

    info.pup_tent_js_variables.push({name:'globalDataGraph',value:disPhenoDist.dataGraph});
    info.monarch_launchable = [];
    info.monarch_launchable.push('makeDiseasePhenotypeGraph(globalDataGraph)');

    info.title = 'Monarch Diseases';
    
    var output = pup_tent.render('disease_main.mustache', info,'monarch_base.mustache');
    var res =  response.html(output);
    return res;
});


// DISEASE PAGE
// Status: working but needs work
app.get('/legacy/disease/:id.:fmt?', function(request, id, fmt) {
    try {
        engine.log("getting /disease/:id where id="+id);
        var newId = engine.resolveClassId(id);
        if (newId != id && typeof newId != 'undefined' ) {
            engine.log("redirecting: "+id+" ==> "+newId);
            return response.redirect(genURL('disease',newId));
        }
        engine.log("Fetching id from engine, where cache="+engine.cache);
        var info = engine.fetchDiseaseInfo(id);

        if (info == null || info.id == null) {
            return notFoundResponse("Cannot find "+id);
        }

        engine.log("Got info for disease");
        if (fmt != null) {
            return formattedResults(info, fmt,request);
        }

        // HTML
        addCoreRenderers(info, 'disease', id);

        //Add pup_tent libs
        info.pup_tent_css_libraries.push("/monarch-main.css");
        info.pup_tent_css_libraries.push("/monarch-specific.css");
        info.pup_tent_css_libraries.push("/imagehover.css");
	
        info.pup_tent_css_libraries.push("/phenogrid.css");
	addPhenogridFiles(info);

        info.pup_tent_js_libraries.push("/phenogridloader-no-species.js");
        info.pup_tent_js_libraries.push("/stupidtable.min.js");
        info.pup_tent_js_libraries.push("/tables.js");

        info.title = 'Monarch Disease: '+info.label+' ('+ info.id+')';

        //HACK because we are always redirected to the underscore, we need curi-style ids for proper link generation
        //ONTOQUEST!!!
        info.primary_xref = function() {return genExternalHref('source',{id : id.replace(/_/,':')})};

        info.hasHeritability = function() {return checkExistence(info.heritability)};
        info.heritability = engine.unique(info.heritability.map(function(h) {return h.inheritance.label})).join(", "); 
    
        if (typeof info.synonyms != 'undefined'){
            info.aka = info.synonyms.join(", ");
        }
        
        info.xrefs = function() {
            if (info.database_cross_reference != null) {
                return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
                //return info.database_cross_reference.join(", ");
            }
        };
        info.altids = function() {
            if (info.has_alternative_id != null) {
                return info.has_alternative_id.join(", ");
            }
        }

        // variables checking existence of data in sections
        info.hasDef = function() {return checkExistence(info.definitions)};
        info.hasComment = function() {return checkExistence(info.comment)};
        info.hasAka = function() {return checkExistence(info.synonyms)};
        info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};

        info.hasPhenotypes = function() {return checkExistence(info.phenotype_associations)};
        info.hasGenes = function() {return checkExistence(info.gene_associations)};
        info.hasAlleles = function() {return checkExistence(info.alleles)};
        info.hasModels = function() {return checkExistence(info.models)};
        info.hasSim = function() {return simcount() > 0};
        info.hasPathways = function() {return checkExistence(info.pathway_associations)};
        info.hasLiterature = function() {return checkExistence(info.literature)};

        //the score is out of 1, so scale to 5 stars
        info.annotationScore = function() {
            if (info.annotation_sufficiency != null) {
                return (5 * info.annotation_sufficiency);
            } else {
                return 0;
            }
        };
        //info.phenotypeNum = function() {return getNumLabel(info.phenotype_associations)};
        info.phenotypeNum = function() {
            if (info.phenotype_associations != null) {
                return getNumLabel(engine.unique(info.phenotype_associations.map(function(p) {return p.phenotype.id})))};
            return 0;
            };
        info.geneNum = function() {
            if (info.gene_associations != null) {
                return getNumLabel(engine.unique(info.gene_associations.map(function(g) {return g.gene.id})))};
            return 0;
            };
        info.alleleNum = function() {return getNumLabel(info.alleles)};
        info.modelNum = function() {return getNumLabel(info.models)};
        info.simNum = function() {return simcount()};
        info.literatureNum = function() {return getNumLabel(info.pmidinfo)};

        var simcount = function() {
            if (info.similar_diseases != null) {
                var unnestedAssocs = [];
                for (var i = 0; i < info.similar_diseases.length; i++) {
                    var iset = info.similar_diseases[i];
                    for (var j = 0; j < iset.b.length; j++) {
                        unnestedAssocs = unnestedAssocs.concat({a:iset.a, b:iset.b[j]});
                    }
                }
                return unnestedAssocs.length;
            }
            return 0;
        };
        //need to count the num of unique pathways
        info.pathwayNum = function() {
            if (info.pathway_associations != null) {
                var pathwayIds = [];
                pathwayIds = info.pathway_associations.map(function(a) {return a.pathway.id})
                pathwayIds = engine.unique(pathwayIds);
                return pathwayIds.length;
            }
            return 0;
        };

	// filter phenotype list for formatting for phenogrid.
        // adorn object with rendering functions
        info.phenotypeTable = function() {return genTableOfDiseasePhenotypeAssociations(info.phenotype_associations);};
        info.geneTable = function() {return genTableOfDiseaseGeneAssociations(info.gene_associations);};
        info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles);};
        //engine.log("ALLELE TABLE-pre mustache:"+JSON.stringify(info));
        info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models);};
        //TODO: figure out how to best show this... one table per species?
        //TODO: defaulting to showing mouse here - since it's the only one we have
        info.simModelTable = function () {return genTableOfSimilarModels(info.similar_models['10090']);};
        info.simTable = function() {return genTableOfSimilarDiseases(info.similar_diseases);};
        info.pathwayTable = function() {return genTableOfDiseasePathwayAssociations(info.pathway_associations);};
        info.literatureTable = function() {return genTableOfLiterature(info.literature, info.pmidinfo);};

        var output = pup_tent.render('disease-legacy.mustache',info,'monarch_base.mustache');
        return response.html(output);

        //var r = response.html(Mustache.to_html(getTemplate('disease'), info));
        return r;
    }
    catch(err) {
        return errorResponse(err);
    }

});

// This function checks if a variable exists in the JSON blob (and is used to dynamically
// render the Mustache templates.
function checkExistence(variable) {
    if (variable != null) {
        return variable.length > 0;
    }
};

// This function returns the number of variables in the JSON blob.
// The number is returned as a label suitable for display - if the number
// is higher than the cutoff then "+" is appended
function getNumLabel(variable) {
    if (variable != null) {
        if (variable.length == 1000) {
            return "1000+";
        }
        return variable.length;
    }
};

// DISEASE - Sub-pages
// Example: /disease/DOID_12798/phenotype_associations.json
// Currently only works for json or rdf output
app.get('/legacy/disease/:id/:section.:fmt?', function(request, id, section, fmt) {
    var newId = engine.resolveClassId(id);
    if (newId != id) {
        engine.log("redirecting: "+id+" ==> "+newId);
        return response.redirect(genURL('disease',newId));
    }

    var info = engine.fetchDiseaseInfo(id);

    var sectionInfo =
        { id: "obo:"+id }; // <-- TODO - unify ID/URI strategy
    sectionInfo[section] = info[section];
    engine.addJsonLdContext(sectionInfo);

    if (fmt != null) {
        return formattedResults(sectionInfo, fmt,request);
    }
    else {
        return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
    }
});

// Method: phenotype
//
// phenotype info or page
//
// This will combine multiple sources of data combining disease, gene, genotype, pathway etc
// data. The aggregation makes use of the ontology; e.g. the results for MP_0011475 (abnormal glycosaminoglycan level) will
// include info association directly for this term, as well as subtypes (e.g. abnormal urine glycosaminoglycan level)
//
// Implementation:
//  - <monarch.api.fetchDiseaseInfo>
//
// Paths:
//  - /phenotype/  (HTML only)
//  - /phenotype/:id (combined info about a phenotype)
//  - /phenotype/:id/:section
//
//
// Formats:
//  - html
//  - json
//
//  Examples:
//  - /phenotype/ (Top page)
//  - /phenotype/MP_0011475 (abnormal glycosaminoglycan level)
//  - /phenotype/MP:0011475 (same as above - CURIES or URI fragments may be used)
//  - /phenotype/MP_0011475/disease_associations.json (Diseases with abnormal glycosaminoglycan level as JSON)
//
//
// Returns:
//  Phenotype with matching ID

app.get('/phenotype', function(request) {
    var info = prepLandingPage();
    info.blog_results = loadBlogData('phenotype-news', 4);
   
	//spotlight
    info.spotlight = engine.fetchSpotlight('phenotype');
    //info.spotlight.link = genObjectHref('phenotype',{id:info.spotlight.id, label:"Explore"});
    info.spotlight.link = genObjectHref('phenotype',info.spotlight);

    var genes = _sortByLabel(info.spotlight.genes).map(function(g) genObjectHref('gene',g));
    info.spotlight.genes = genes.slice(0,5).join(", ");
    if (genes.length > 5) {
        info.spotlight.genes += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(genes.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.genes += genes.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    var diseases = _sortByLabel(info.spotlight.diseases).map(function(p) genObjectHref('disease',p));
    if (diseases.length == 0) {
		diseases = ['(none)'];
    }
    info.spotlight.diseases = diseases.slice(0,5).join(", ");
    if (diseases.length > 5) {
        info.spotlight.diseases += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(diseases.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.diseases += diseases.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    
    if (info.spotlight.model_count > 0){
        info.spotlight.models = "<a href=/phenotype/"+info.spotlight.id+"#genotypes>"+info.spotlight.model_count+"</a>";
    } else {
        info.spotlight.models = info.spotlight.model_count;
    }
    
    if (info.spotlight.publication_count > 0){
        info.spotlight.publications = "<a href=/phenotype/"+info.spotlight.id+
        "#literature>"+info.spotlight.publication_count+"</a>";
    } else {
        info.spotlight.publications = info.spotlight.publication_count;
    }

    //var pathways = info.spotlight.pathways.map(function(p) {p.label});
    //info.spotlight.pathways = pathways.slice(0,5).join(", ");
    //if (pathways.length > 5) {
    //    info.spotlight.pathways += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(pathways.length-5)+" more...]</span><span class=\"moreitems\">";
    //    info.spotlight.pathways += pathways.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    //}



 
    //graph
    var phenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-phenotype-annotation-distro.json'));
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    info.pup_tent_js_libraries.push("/graph_config.js");
    info.pup_tent_js_libraries.push("/BarChart.js");
    info.pup_tent_js_variables.push({name:'globalDataGraph',value:phenoDist.dataGraph});
    info.monarch_launchable = [];
    info.monarch_launchable.push('makePhenotypeAnnotationGraph(globalDataGraph)');
    
    info.title = 'Monarch Phenotypes';
    
    var output = pup_tent.render('phenotype_main.mustache', info,'monarch_base.mustache');
    var res =  response.html(output);
    return res;
});

app.get('/legacy/phenotype/:id.:fmt?', function(request, id, fmt) {

    // TEMPORARY. Remove when this resolved: https://github.com/monarch-initiative/monarch-app/issues/246
    if (id.indexOf("ZP") == 0) {

        var info = {
            message: "Zebrafish phenotypes are currently under construction"
        };
        addCoreRenderers(info);
        info.title = info.message;
        info.pup_tent_css_libraries.push("/monarch-main.css");
        var output = pup_tent.render('underconstruction.mustache',info,'monarch_base.mustache');
        var res =  response.html(output);
        //var res = response.html(Mustache.to_html(getTemplate('underconstruction'),info));
        res.status = 404;
        return res;

    }

    try {
        var info = engine.fetchPhenotypeInfo(id);

        // TEMPORARY - see https://github.com/monarch-initiative/monarch-app/issues/246
        if (info.genotype_associations != null) {
            info.genotype_associations = info.genotype_associations.filter(function(a){return a.has_genotype.id != null && a.has_genotype.id.indexOf("ZFIN") == -1});
        }

        if (fmt != null) {
            return formattedResults(info, fmt,request);
        }

        addCoreRenderers(info, 'phenotype', id);

        //Add pup_tent libs
        info.pup_tent_css_libraries.push("/monarch-main.css");
        info.pup_tent_css_libraries.push("/monarch-specific.css");

        info.pup_tent_js_libraries.push("/stupidtable.min.js");
        info.pup_tent_js_libraries.push("/tables.js");

        info.title = 'Monarch Phenotype: '+info.label+' ('+ info.id+')';

        if (typeof info.synonyms != 'undefined'){
            info.aka = info.synonyms.join(", ");
        }
        
        info.xrefs = function() {
            if (info.database_cross_reference != null) {
            return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
            //return info.database_cross_reference.join(", ");
            }
        };

        // variables checking existence of data in sections
        info.hasDef = function() {return checkExistence(info.definitions)};
        info.hasAka = function() {return checkExistence(info.synonyms)};
        info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};
        info.hasDiseases = function() {return checkExistence(info.disease_associations)};
        info.hasGenes = function() {return checkExistence(info.gene_associations)};
        info.hasGenotypes = function() {return checkExistence(info.genotype_associations)};
        info.hasLiterature = function() {return checkExistence(info.literature)};

        info.diseaseNum = function() {return getNumLabel(info.disease_associations)};
        info.geneNum = function() {
            if (info.gene_associations != null) {
                return getNumLabel(engine.unique(info.gene_associations.map(function(g) {return g.gene.id})))};
            return 0;
            };

        info.genotypeNum = function() {return getNumLabel(info.genotype_associations)};
        info.literatureNum = function() {return getNumLabel(info.pmidinfo)};

        // adorn object with rendering functions
        info.diseaseTable = function() {return genTableOfDiseasePhenotypeAssociations(info.disease_associations)} ;
        info.geneTable = function() {return genTableOfGenePhenotypeAssociations(info.gene_associations)};
        info.genotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.genotype_associations)};
        info.literatureTable = function() {return genTableOfLiterature(info.literature, info.pmidinfo)};

        var output = pup_tent.render('phenotype-legacy.mustache',info,'monarch_base.mustache');
        return response.html(output);
        //return response.html(Mustache.to_html(getTemplate('phenotype'), info));
    }
    catch(err) {
        return errorResponse(err);
    }
});

// Note: currently both /genotype/ and /model/ direct here;
// need to decide if we want these URLs to behave differently, or
// to collapse/redirect
var fetchGenotypePage = function(request, id, fmt) {
    try {
        var info = engine.fetchGenotypeInfo(id);
        if (fmt != null) {
            if (fmt == 'json') {
                return response.json(info);
            }
        }

        console.log("INFO:"+JSON.stringify(info));

        addCoreRenderers(info, 'genotype', id);

        //Add pup_tent libs
        info.pup_tent_css_libraries.push("/monarch-main.css");
        info.pup_tent_css_libraries.push("/monarch-specific.css");
        info.pup_tent_css_libraries.push("/imagehover.css");
        info.pup_tent_css_libraries.push("/phenogrid.css");
	addPhenogridFiles(info);

        info.pup_tent_js_libraries.push("/genotypepage.js");
        info.pup_tent_js_libraries.push("/stupidtable.min.js");
        info.pup_tent_js_libraries.push("/tables.js");

        info.title = 'Monarch Genotype: '+info.label+' ('+ info.id+')';

        info.overview = function() {return genOverviewOfGenotype(info) };

        // variables checking existence of data in sections
        info.hasPhenotypes = function() {return checkExistence(info.phenotype_associations)};
        info.hasDiseases = function() {return checkExistence(info.disease_associations)};
        info.hasGenes = function() {return checkExistence(info.has_affected_genes)};
        info.hasVariants = function() { return checkExistence(info.has_sequence_alterations)};
        info.hasSim = function() {return checkExistence(info.sim)};
        info.hasLiterature = function() {return checkExistence(info.literature)};

        info.phenotypeNum = function() {
            if (info.phenotype_associations != null) {
                return getNumLabel(engine.unique(info.phenotype_associations.map(function(p) {
                    if (typeof p.has_phenotype != 'undefined' && typeof p.has_phenotype.type != 'undefined')
                        return p.has_phenotype.type.id})))};
            return 0;
        };


        info.diseaseNum = function() {return getNumLabel(info.disease_associations)};
        info.geneNum = function() {return getNumLabel(info.has_affected_genes)};
        info.variantNum = function() {
            return getNumLabel(vassoc)
        };
        info.simNum = function() {return getNumLabel(info.sim)};
        info.literatureNum = function() {return getNumLabel(info.pmidinfo)};

        info.primary_xref = genMGIXRef(id);
        info.taxon_xref;
        if (info.taxon){
            info.taxon_xref = function() {return genExternalHref('source',info.taxon)};
        }


        //info.xrefs = function() {return genExternalHref('source',{id : id})};

        // adorn object with rendering functions
        info.phenotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.phenotype_associations);} ;
        info.literatureTable = function() {return genTableOfLiterature(info.literature, info.pmidinfo);};
        info.variantTable = function() {return genTableOfGenoVariantAssociations(info);};

        info.annotationScore = function() {
            if (info.annotation_sufficiency != null) {
                return (5 * info.annotation_sufficiency);
            } else {
                return 0;
            }
        };

        var output = pup_tent.render('genotype-legacy.mustache',info,'monarch_base.mustache');
        return response.html(output);
        //return response.html(Mustache.to_html(getTemplate('genotype'), info));
    }
    catch(err) {
        return errorResponse(err);
    }
};

var fetchModelPage = function(request, id, fmt) {
    try {
        // Rendering.
        var info = {};
        info = engine.fetchDataInfo(id);
    
        if (fmt != null) {
            return formattedResults(info, fmt,request);
        }
        
        if (typeof info.id === 'undefined'){
            info.id = id;
        }
        if (typeof info.label === 'undefined'){
            info.label = id;
        }
    
        addCoreRenderers(info, 'model', id);
    
        addGolrStaticFiles(info);
    
        //Load variables for client side tables
        var disease_filter = { field: 'subject_category', value: 'disease' };
        addGolrTable(info, "object_closure", id, 'disease-table', disease_filter );
        
        var phenotype_filter = { field: 'object_category', value: 'phenotype' };
        addGolrTable(info, "subject_closure", id, 'phenotypes-table', phenotype_filter );
    
        var gene_filter = { field: 'subject_category', value: 'gene' };
        addGolrTable(info, "object_closure", id, 'gene-table', gene_filter );
    
        var variant_filter = { field: 'object_category', value: 'variant' };
        addGolrTable(info, "subject_closure", id, 'model-table', variant_filter );
    
        var variant_filter = { field: 'subject_category', value: 'variant' };
        addGolrTable(info, "object_closure", id, 'variant-table', variant_filter );
    
        var pathway_filter = { field: 'object_category', value: 'process' };
        addGolrTable(info, "subject_closure", id, 'pathway-table', pathway_filter );
    
        // Phenogrid
        addPhenogridFiles(info);
        //info.pup_tent_js_libraries.push("/genotypepage.js");
        info.pup_tent_js_libraries.push("/phenogridloader-no-species.js");
        
        // Add templates
        info.includes.phenotype_anchor = addPhenotypeAnchor(info);
        info.includes.phenotype_table = addPhenotypeTable();
    
        // Add gene table
        info.includes.gene_anchor = addGeneAnchor(info);
        info.includes.gene_table = addGeneTable();
    
        // Add model table
        info.includes.variant_anchor = addVariantAnchor(info);
        info.includes.variant_table = addVariantTable();
    
        // Add variant table
        info.includes.disease_anchor = addDiseaseAnchor(info);
        info.includes.disease_table = addDiseaseTable();
    
        // Add pathway table
        info.includes.pathway_anchor = addPathwayAnchor(info);
        info.includes.pathway_table = addPathwayTable();

        info.title = 'Monarch Model: '+info.label+' ('+ info.id+')';

        info.primary_xref = function() {return genExternalHref('source',{id : id})};

        if (typeof info.synonyms != 'undefined'){
            info.aka = info.synonyms.join(", ");
        }
        
        info.xrefs = function() {
            if (info.database_cross_reference != null) {
                return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
            //return info.database_cross_reference.join(", ");
            }
        };
        info.altids = function() {
            if (info.has_alternative_id != null) {
                return info.has_alternative_id.join(", ");
            }
        }

        // variables checking existence of data in sections
        info.hasDef = function() {return checkExistence(info.definitions)};
        info.hasComment = function() {return checkExistence(info.comment)};
        info.hasAka = function() {return checkExistence(info.synonyms)};
        info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};
        info.hasPhenotypes = true;
        info.includes.phenogrid_anchor = Mustache.to_html(getTemplate('phenogrid-anchor'), info);
    
        var output = pup_tent.render('model.mustache', info,
                                     'monarch_base.mustache');
        return response.html(output);     
    }
    catch(err) {
        return errorResponse(err);
    }
};

var genMGIXRef = function genMGIXRef(id){
    return "<a href=\"http://www.informatics.jax.org/allele/genoview/" +
            id + "\" target=\"_blank\">" + id + "</a>";
};

app.get('/genotype/:id.:fmt?',fetchModelPage);
app.get('/legacy/genotype/:id.:fmt?',fetchGenotypePage);


// GENOTYPE - Sub-pages
// Example: /genotype/MGI_4420313/genotype_associations.json
// Currently only works for json or rdf output
var fetchGenotypeSection =  function(request, id, section, fmt) {
    var newId = engine.resolveClassId(id);
    if (newId != id) {
        engine.log("redirecting: "+id+" ==> "+newId);
        return response.redirect(genURL('genotype',newId));
    }

    var info = engine.fetchGenotypeInfo(id);

    var sectionInfo =
        { id: "obo:"+id }; // <-- TODO - unify ID/URI strategy
    sectionInfo[section] = info[section];
    engine.addJsonLdContext(sectionInfo);

    if (fmt != null) {
        return formattedResults(sectionInfo, fmt,request);
    }
    else {
        return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
    }
};

app.get('/legacy/genotype/:id./:section.:fmt?',fetchGenotypeSection);

app.get('/gene', function(request) {
    var info = prepLandingPage();
    info.blog_results = loadBlogData('gene-news', 4);
    info.spotlight = engine.fetchSpotlight('gene');
    //info.spotlight.link = genObjectHref('gene',{id:info.spotlight.id, label:"Explore"});
    info.spotlight.link = genObjectHref('gene',info.spotlight);

    var phenotypes = _sortByLabel(info.spotlight.phenotypes).map(function(p) genObjectHref('phenotype',p));
    info.spotlight.phenotypes = phenotypes.slice(0,5).join(", ");
    if (phenotypes.length > 5) {
        info.spotlight.phenotypes += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(phenotypes.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.phenotypes += phenotypes.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    var diseases = _sortByLabel(info.spotlight.diseases).map(function(p) genObjectHref('disease',p));
    if (diseases.length == 0) {
    diseases = ['(none)'];
    }
    info.spotlight.diseases = diseases.slice(0,5).join(", ");
    if (diseases.length > 5) {
        info.spotlight.diseases += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(diseases.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.diseases += diseases.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }

    var pathways = info.spotlight.pathways.map(function(p) {p.label});
    info.spotlight.pathways = pathways.slice(0,5).join(", ");
    if (pathways.length > 5) {
        info.spotlight.pathways += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(pathways.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.pathways += pathways.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    if (info.spotlight.publication_count > 0){
        info.spotlight.publications = "<a href=/gene/"+info.spotlight.id+
        "#literature>"+info.spotlight.publication_count+"</a>";
    } else {
        info.spotlight.publications = info.spotlight.publication_count;
    }
    
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    info.pup_tent_js_libraries.push("/BarChart.js");
    info.pup_tent_js_libraries.push("/graph_config.js");
    
    var diseaseDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-disease-gene-distro.json'));

    info.pup_tent_js_variables.push({name:'globalDataGraph',value:diseaseDist.dataGraph});
    info.monarch_launchable = [];
    info.monarch_launchable.push('makeDiseaseGeneGraph(globalDataGraph)');
    
    info.title = 'Monarch Genes';

    var output = pup_tent.render('gene_main.mustache', info,'monarch_base.mustache');
    var res =  response.html(output);
    return res;
});

// Status: STUB
app.get('/legacy/gene/:id.:fmt?', function(request, id, fmt) {

    //Redirect to NCBI Gene ID
    var mappedID = getGeneMapping(id);
    if (typeof mappedID != 'undefined' && mappedID != id){
        engine.log("found updated ID, redirecting to: "+mappedID);
        return response.redirect(genURL('gene',mappedID,fmt));
    }

    var info;
    try {
        info = engine.fetchGeneInfo(id);
    }
    catch(err) {
        return errorResponse(err);
    }
    console.log("got gene info..phenotype list is "+JSON.stringify(info.phenotype_list));

    if (fmt != null) {
        return formattedResults(info,fmt,request);
    }

    // HTML
    addCoreRenderers(info, 'gene', id);

    //Add pup_tent libs
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.pup_tent_css_libraries.push("/monarch-specific.css");
    info.pup_tent_css_libraries.push("/imagehover.css");
    
    info.pup_tent_css_libraries.push("/phenogrid.css");

    info.pup_tent_js_libraries.push("/stupidtable.min.js");
    info.pup_tent_js_libraries.push("/tables.js");
    addPhenogridFiles(info);

    info.pup_tent_js_libraries.push("/phenogridloader-no-species.js");

    info.title = 'Monarch Gene: '+info.label+' ('+ info.id+')';

    // variables checking existence of data in sections
    info.hasPhenotypes   = function() {return checkExistence(info.phenotype_associations)};
    info.hasPathways     = function() {return checkExistence(info.pathway_associations)};
    info.hasDiseases     = function() {return checkExistence(info.disease_associations)};
    info.hasGenotypes    = function() {return checkExistence(info.genotype_associations)};
    info.hasLocation     = function() {return checkExistence(info.location)};
    info.hasAlleles      = function() {return checkExistence(info.alleles)};
    info.hasOrthologs    = function() {return checkExistence(info.orthologs)};
    info.hasInteractions = function() {return checkExistence(info.interactions)};
    info.hasSummary      = function() {return checkExistence(info.summary)};
    info.hasLiterature   = function() {return checkExistence(info.literature)};
    info.hasSynonym   = function() {return checkExistence(info.synonyms)};

    //info.phenotypeNum = function() {return getNumLabel(info.phenotype_associations)};
    info.phenotypeNum = function() {
        if (info.phenotype_associations != null) {
            return getNumLabel(engine.unique(info.phenotype_associations.map(function(p) {return p.phenotype.id})))};
        return 0;
    };

    info.genotypeNum    = function() {return getNumLabel(info.genotype_associations)};
    info.pathwayNum     = function() {return getNumLabel(info.pathway_associations)};
    info.diseaseNum     = function() {return getNumLabel(info.disease_associations)};
    info.alleleNum      = function() {return getNumLabel(info.alleles)};
    info.orthologNum    = function() {return getNumLabel(info.orthologs)};
    info.interactionNum = function() {return getNumLabel(info.interactions)};
    info.literatureNum  = function() {return getNumLabel(info.pmidinfo)};

    // adorn object with rendering functions
    info.phenotypeTable   = function() {return genTableOfGenePhenotypeAssociations(info.phenotype_associations);};
    info.pathwayTable     = function() {return genTableOfGenePathwayAssociations(info.pathway_associations);};
    info.diseaseTable     = function() {return genTableOfGeneDiseaseAssociations(info.disease_associations);};
    info.genotypeTable    = function() {return genTableOfGeneGenotypeAssociations(info.genotype_associations);};
    info.alleleTable      = function() {return genTableOfGeneAlleleAssociations(info.alleles);};
    info.orthologTable    = function() {return genTableOfGeneOrthologAssociations(info.orthologs);};
    info.interactionTable = function() {return genTableOfGeneInteractionAssociations(info.interactions);};
    info.literatureTable  = function() {return genTableOfLiterature(info.literature, info.pmidinfo);};

    info.primary_xref = function() {return genExternalHref('source',{id : info.id})};
    info.xrefTable    = function() {return genTableOfGeneXRefs(info.xrefs);};

    info.annotationScore = function() {
        if (info.annotation_sufficiency != null) {
            return (5 * info.annotation_sufficiency);
        } else {
            return 0;
        }
    };

    //Link out to NCBI
    info.taxon_xref;

    if (info.taxon){
        info.taxon_xref = function() {return genExternalHref('source',info.taxon)};
    }

    var output = pup_tent.render('gene-legacy.mustache',info,'monarch_base.mustache');
    return response.html(output);
    //return response.html(Mustache.to_html(getTemplate('gene'), info));
});

var fetchModelLandingPage = function (request){
    
    var info = prepLandingPage();
    info.blog_results = loadBlogData('model-news', 4);

    //spotlight
    info.spotlight = engine.fetchSpotlight('model');
    //info.spotlight.link = genObjectHref('model',{id:info.spotlight.id, label:"Explore"});
    info.spotlight.link = genObjectHref('model',info.spotlight);

    var phenotypes = _sortByLabel(info.spotlight.phenotypes).map(function(p) genObjectHref('phenotype',p));
    info.spotlight.phenotypes = phenotypes.slice(0,5).join(", ");
    if (phenotypes.length > 5) {
        info.spotlight.phenotypes += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(phenotypes.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.phenotypes += phenotypes.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    var diseases = _sortByLabel(info.spotlight.diseases).map(function(p) genObjectHref('disease',p));
    if (diseases.length == 0) {
    diseases = ['(none)'];
    }
    info.spotlight.diseases = diseases.slice(0,5).join(", ");
    if (diseases.length > 5) {
        info.spotlight.diseases += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(diseases.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.diseases += diseases.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    var genes = _sortByLabel(info.spotlight.genes).map(function(g) genObjectHref('gene',g));
    info.spotlight.genes = genes.slice(0,5).join(", ");
    if (genes.length > 5) {
        info.spotlight.genes += ", <span class=\"toggleitems\"><span class=\"fewitems\"> [and "+(genes.length-5)+" more...]</span><span class=\"moreitems\">";
        info.spotlight.genes += genes.slice(5).join(", ") + "</span><span class=\"hideitems\"> [hide]</span></span>";
    }
    
    if (info.spotlight.publication_count > 0){
        info.spotlight.publications = "<a href=/model/"+info.spotlight.id+
        "#literature>"+info.spotlight.publication_count+"</a>";
    } else {
        info.spotlight.publications = info.spotlight.publication_count;
    }
    
    //graph
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    info.pup_tent_js_libraries.push("/BarChart.js");
    info.pup_tent_js_libraries.push("/graph_config.js");
    var phenoGenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-pheno-genotype-distro.json'));

    info.pup_tent_js_variables.push({name:'globalDataGraph',value:phenoGenoDist.dataGraph});
    info.monarch_launchable = [];
    info.monarch_launchable.push('makePhenoGenoGraph(globalDataGraph)');
    
    info.title = 'Monarch Models';
    
    var output = pup_tent.render('model_main.mustache', info,'monarch_base.mustache');
    var res =  response.html(output);
    return res;
}

app.get('/model', fetchModelLandingPage);
app.get('/genotype', fetchModelLandingPage);

function getGeneMapping(id) {
    var mappedID;
    var mappings = engine.mapGeneToNCBIgene(id);
    var ncbigene_ids = Object.keys(mappings);
    if (ncbigene_ids.length > 0) {
        mappedID = mappings[ncbigene_ids[0]]['id'];
    }
    return mappedID;
}

// GENE - Sub-pages
// Example: /gene/NCIBGene:12166/phenotype_associations.json
// Currently only works for json or rdf output
app.get('/legacy/gene/:id/:section.:fmt?', function(request, id, section, fmt) {
    //Below breaks phenogrid loading due to endless redirect loops
    
    var mappedID = getGeneMapping(id);
    if (typeof mappedID != 'undefined' && mappedID != id){
        engine.log("found updated ID, redirecting to: "+mappedID);
        return response.redirect(genURL('gene',mappedID,fmt));
    }
    var info = engine.fetchGeneInfo(id);

    var sectionInfo =
        { id: "obo:"+id }; // <-- TODO - unify ID/URI strategy
    sectionInfo[section] = info[section];
    engine.addJsonLdContext(sectionInfo);

    if (fmt != null) {
        return formattedResults(sectionInfo, fmt,request);
    }
    else {
        return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
    }
});


//For recieving of HPO relations for Phenogrid
//Example: /neighborhood/HP_0003273/2/out/subClassOf.json
app.get('/neighborhood/:id/:depth/:direction/:relationship.:fmt?', function(request, id, depth, direction, relationship, fmt) {
    var info = engine.getGraphNeighbors(id, depth, relationship, direction);

    if (fmt != null) {
        return formattedResults(info, fmt, request);
    }
    else {
        return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
    }
});

// Status: STUB
// this just calls the genotype page - TODO
app.get('/legacy/model/:id.:fmt?', fetchGenotypePage);
app.get('/legacy/model/:id/:section.:fmt?', fetchGenotypeSection);

app.get('/model/:id.:fmt?', fetchModelPage);

// Status: STUB
// note we hardcode this for now
app.get('/phenome/Homo_sapiens.gff3', function(request, id, fmt) {

    var url = 'http://beta.neuinfo.org/services/v1/federation/data/nlx_152525-9.tsv?q=*&offset=0';

    var gffStr = httpclient.get(url, {}).content;
    return {
        body: [gffStr],
        headers: {'Content-Type': 'text/plain'},
        status: 200
    };
});


// Method: compare
//
// phenotypic comparison between two entities
//
// Given a query id (such as a gene, genotype, disease), and one or more target identifiers, this will map
// each to it's respective phenotypes, and perform an OwlSim comparison of the query to each target.
// You are permitted to mix query and target types.  For example, your query can be a disease, and the target
// be a list of gene(s), disease(s), phenotype(s), and/or genotype(s).
// You can indicate to union the phenotypes of either the query or the target with a plus "+".  Only one
// entity may be supplied for the query, whereas multiple target entities are allowed (delimited by a comma).
//
// For details on owlsim, see http://owlsim.org
//
// Paths:
//  - /compare/  (HTML only)
//  - /compare/:id1/:id2  (JSON only)
//  - /compare/:id1/:id2,id3,...idN (JSON only)
//  - /compare/:id1+:id2/:id3,:id4,...idN (JSON only)
//  - /compare/:id1/:id2+:id3,:id4,:id5+:id6,...,:idN (JSON only)
//
// Formats:
//  - json
//
//  Examples:
//  - /compare/OMIM:143100/MGI:3664660.json
//  - /compare/OMIM:270400/NCBIGene:18595+OMIM:249000,OMIM:194050.json
//  - /compare/HP:0000707+HP:0000372/NCBIGene:18595,HP:0000707,NCBIGene:18595+HP:0000707
//
// Returns:
//  A pairwise-comparison of phenotypes belonging to the query to the target(s), together with the LCS, and their scores.
//  The data follows the same format as is used for search.  The query (including it's identifier, label, type, and
//  phenotype ids will be listed in the "a" object; the target(s) in the "b" array object.  If only one b is supplied,
//  only one element will be found in "b".
//  The resulting "combinedScore" is generated based on a perfect match of the query to itself.  Therefore, the reciprocal
//  combined score may not be the same.  QxT !== TxQ.
app.get('/compare/:x/:y.:fmt?', function(request, x, y, fmt) {
	
	var xs = x.split("+");
	//first, split by comma.  then split by plus
    var ys = y.split(",");
	ys = ys.map(function(i){return i.split("+") });

	//pass the arrays
    var info = engine.compareEntities(xs,ys);

    return response.json(info);
});


// Redirects
app.get('/reference/:id.:fmt?', function(request, id, fmt) {
    //var info = engine.fetchReferenceInfo(id);  TODO
    //return response.redirect(engine.expandIdToURL(id));
    var url = makeExternalURL(id);
    return response.redirect(url);
});

// STUB
app.get('/publication/basic/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchReferenceInfo(id);  //TODO
});

//Get orthologs/paralogs
app.get('/query/orthologs/:id.:fmt?', function(request, id, fmt) {
    var res;
    var idList = id.split("+");
    if (idList == '.json'){
        res = response.error("No gene IDs entered")
    } else {
        var info = engine.fetchOrthologList(idList);
        res = response.json(info);
    }
    
    return res;
});

app.get('/legacy/variant/:id.:fmt?', function(request, id, fmt) {
    //since we don't have allele or variant pages,
    //we will redirect to the sources for now
    //var newId = engine.resolveClassId(id);
    var url;
    if (id.match(/^OMIM/)){
        url = makeExternalURL(id+"."+fmt);
    } else {
        url = makeExternalURL(id);
    }
    engine.log("redirecting: "+id+" to source at "+url);
    return response.redirect(url);
});

app.get('/class', function(request) {
    return staticTemplate('class_main');
});

// generic ontology view - most often this will be overridden, e.g. a disease class
// Status: STUB
app.get('/class/:id.:fmt?', function(request, id, fmt) {
    var opts =
        {
            level : request.params.level
        };

       var info = engine.fetchClassInfo(id, opts);  // Monarch API is currently a simpler wrapper to OntoQuest
    if (fmt != null) {
        if (fmt == 'json') {
            return formattedResults(info,fmt,request);
        }
        else {
            return response.error("Cannot return results in this format: "+fmt);
        }
    }

    // adorn object with rendering functions
    //info.diseaseTable = function() {return genTableOfDiseaseGeneAssociations(info.disease_associations)} ;
    //info.phenotypeTable = function() {return genTableOGenePhenotypeAssociations(info.phenotype_associations)} ;
    //info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;

    return response.html(Mustache.to_html(getTemplate('class'), info));
});

app.get('/anatomy', function(request) {
    return staticTemplate('anatomy_main');
});

app.get('/anatomy/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchAnatomyInfo(id);  // OQ
    if (fmt != null) {
    return formattedResults(info,fmt,request);
    }

    addCoreRenderers(info, 'anatomy', id);

    //Add pup_tent libs
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.pup_tent_css_libraries.push("/monarch-specific.css");

    info.pup_tent_js_libraries.push("/stupidtable.min.js");
    info.pup_tent_js_libraries.push("/tables.js");

    info.title = 'Monarch Anatomy: '+info.label;

    if (false) {
        // this is too slow
        info.hasDiseases = function() {return checkExistence(info.disease_associations)};
        info.hasGenotypes = function() {return checkExistence(info.genotype_associations)};

        info.diseaseNum = function() {return getNumLabel(info.disease_associations)};
        info.genotypeNum = function() {return getNumLabel(info.genotype_associations)};

        info.diseaseTable = function() {return genTableOfDiseasePhenotypeAssociations(info.disease_associations);} ;
        info.genotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.genotype_associations);};
    }

    info.phenotypeHrefs = info.phenotypes.map(function(p) { return genObjectHref('phenotype',p) });

    // adorn object with rendering functions
    info.expressionTable = function() {return genTableOfGeneExpressionAssocations(info.gene_associations);} ;
    //info.diseaseTable = function() {return genTableOfDiseaseGeneAssociations(info.disease_associations)} ;
    //info.phenotypeTable = function() {return genTableOGenePhenotypeAssociations(info.phenotype_associations)} ;
    //info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;

    //return response.html(Mustache.to_html(getTemplate('anatomy'), info));
    var output = pup_tent.render('anatomy.mustache',info,'monarch_base.mustache');
    return response.html(output);
});

/* Literature Pages */
app.get('/literature', function(request) {
    return staticTemplate('literature_main');
});

app.get('/literature/:id.:fmt?', function(request, id, fmt) {
    var info;
    var regex = /^PMID:(\d+)$/;
    var regres = regex.exec(id);
    if (regres != null) {
        info = engine.fetchLiteratureInfo(regres[1]);
    }
    if (fmt != null) {
        return formattedResults(info,fmt,request);
    }

    addCoreRenderers(info, 'literature', id);

    //Add pup_tent libs
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.pup_tent_css_libraries.push("/monarch-specific.css");

    info.pup_tent_js_libraries.push("/stupidtable.min.js");
    info.pup_tent_js_libraries.push("/tables.js");

    info.title = 'Monarch Literature: '+info.label+' ('+ info.id+')';

    info.authorList = function() {
        var auths = info.authors.slice(0, 5).join(", ");
        if (info.authors.length > 5) {
            auths += ", <span class=\"littabmoreauthors\"><span class=\"etal\">et al</span><span class=\"moreauthors\">"
            auths += info.authors.slice(5).join(", ") + ", " + "</span><span class=\"hideauthors\">hide</span></span>";
        }
        return auths;
    };
    info.meshTerms = function() {
        return info.meshHeadings.join(", ");
    };

    info.hasSimilar = function() { return checkExistence(info.similarPapers) };
    info.hasGenes = function() { return checkExistence(info.genes) };
    info.similarNum = function() { return getNumLabel(info.similarPapers) };
    info.genesNum = function() { return getNumLabel(info.genes) };
    info.similarPapersTable = function() { return genTableOfSimilarPapers(info.similarPapers) };
    info.genesTable = function() { return genTableOfLiteratureGenes(info.genes) };

    //return response.html(Mustache.to_html(getTemplate('literature'), info));
    var output = pup_tent.render('literature.mustache',info,'monarch_base.mustache');
    return response.html(output);
});

function getIdentifierList(params) {
    //engine.log("Params="+JSON.stringify(params));
    var input_items;
    if (params.a != null) {
        input_items = params.a;
        engine.log("Request: "+input_items);
        engine.log("Request Type: "+ typeof input_items);
    }
    else {
        input_items = params.input_items.split(/[\s,]+/);
    }
    engine.log("|Input| = "+input_items.length);
    engine.log("Input: "+input_items);
    return input_items;
}


function mapStyleToCategories(style) {
    engine.log("Mapping "+style+" to categories");
    //TODO: use external "style" files to map the style parameter to categories
    //for now, default to HPO categories
    var categories = [];
    categories = ["HP:0000924", "HP:0000707", "HP:0000152", "HP:0001574", "HP:0000478", "HP:0001626", "HP:0001939", "HP:0000119", "HP:0001438", "HP:0003011", "HP:0002664", "HP:0001871", "HP:0002715", "HP:0000818", "HP:0002086", "HP:0000598", "HP:0003549", "HP:0001197", "HP:0001507", "HP:0000769"];
    return categories;
}

app.get('/score', function(request) {
    engine.log("Ready to score");
    engine.log("Params:"+JSON.stringify(request.params));
    var target = null;
    var categories = request.params.categories || [];
    //default to phenotips categories.
    //TODO: make monarch categories
    var style = request.params.style || 'phenotips';
    categories = mapStyleToCategories(style);
    var annotation_profile = request.params.annotation_profile;
    annotation_profile = JSON.parse(annotation_profile);
    var myresults = engine.getInformationProfile(annotation_profile,categories);
    return response.json(myresults);
});


// Method: simsearch
//
// Performs OwlSim search over entities using a search profile of ontology classes
//
// For details on owlsim, see http://owlsim.org
//
// Implementation:
//  - <monarch.api.searchByDisease>
//  - <monarch.api.searchByPhenotype>
//
// Paths:
//  - /simsearch//disease/:id (search using the phenotypes of a disease as search profile)
//  - /simsearch/phenotype/
//
// Arguments:
//  - target_species : integer fragment of NCBI Taxon ID
//  - target_type : disease or gene
//  - limit : max results to return
//
// Formats:
//  - html
//  - json
//
//  Examples:
//  - /simsearch/phenotype/?input_items=MP:0000788,MP:0000802&target_species=10090 (mouse)
//  - /simsearch/phenotype/?input_items=MP:0000788,MP:0000802&target_species=9606 (human)
//
//
// Returns:
//  List of matching entities

app.get('/simsearch/disease/:id.:fmt?', function(request,id,fmt) {
    engine.log("Params:"+JSON.stringify(request.params));
    var target = null;
    var info = {datatype: 'disease', results:[]};
    var target_species = request.params.species || '9606';
    var target_type = request.params.type || 'disease';
    var limit = request.params.cutoff || request.params.limit || 10;

    info.results = engine.searchByDisease(id,target_species,limit);
    return response.json(info.results);

});

var simsearch = function(request, fmt) {
    var target = null;
    var info = {results:[]};
    var target_species = request.params.target_species; //|| '9606'; //default to human
    var target_type = request.params.target_type; //|| 'disease';
    var limit = request.params.cutoff || request.params.limit || 100;
    var input_items = getIdentifierList(request.params);
    //input_items = engine.mapIdentifiersToPhenotypes( input_items );
    info.results = engine.searchByPhenotypeProfile(input_items,target_species,null,limit);

    return response.json(info.results);

};

app.get('/simsearch/phenotype.:fmt?', simsearch);

app.post('/simsearch/phenotype.:fmt?', simsearch);

app.get('/annotate/text.:fmt?', function(request, fmt) {
    var q = request.params.q;

    var pheno_ids = [];
    var info =
        {
            query: q,
            longestOnly: request.params.longestOnly,
            results:[],
        };

    if (q == null || q == "") {
    }
    else {
        info.results = engine.annotateText(q, {longestOnly : request.params.longestOnly});
        info.results.forEach(function(r) {
            engine.log("RES:"+JSON.stringify(r));
            if (r.token.categories.indexOf('Phenotype') > -1) {
                pheno_ids.push(r.token.id);
            }
            r.token.label = r.token.term;
            r.token.href=genObjectHref('phenotype', r.token);
        });
    }

    var markedText = info.query;
    var start = -1, end = -1;
    var currEnd = [];
    var currTerms = [];

    for (var i = info.results.length - 1; i >= 0; i -= 1) {
        var item = info.results[i];
        var token = item.token;
        if (end == -1 || end < item.end || start < item.end) {
            if (end == -1 || item.start < start) {
                start = item.start;
            }
            if (end == -1 || end < item.end) {
                end = item.end;
            }
            if (currTerms.indexOf(token.id) == -1) {
                currEnd.push(token);
                currTerms.push(token.id);
            }
        } else {
            if (end != -1) {
                var str = "<span class=\"linkedspan\">" + markedText.substring(start, end) + "<div class=\"linkedterms\">";
                currEnd = currEnd.reverse();
                for (var j = 0; j < currEnd.length; j += 1) {
                    var link = currEnd[j];
                    str += "<div class=\"linkeditem\">" + link.href + " (" + link.id + ")</div>";
                }
                str += "</div></span>";
                markedText = markedText.substring(0, start) + str + markedText.substring(end);
            }
            start = item.start;
            end = item.end;
            currEnd = [];
            currTerms = [];
            currEnd.push(token);
            currTerms.push(token.id);
        }
    };
    if (currEnd.length > 0) {
        var str = "<span class=\"linkedspan\">" + markedText.substring(start, end) + "<div class=\"linkedterms\">";
        currEnd = currEnd.reverse();
        for (var j = 0; j < currEnd.length; j += 1) {
            var link = currEnd[j];
            str += "<div class=\"linkeditem\">" + link.href + " (" + link.id + ")</div>";
        }
        str += "</div></span>";
        markedText = markedText.substring(0, start) + str + markedText.substring(end);
    };

    info.resultsTable = function() {return genTableOfAnnotateTextResults(info.results, info.query); } ;
    info.inputItems = pheno_ids.join(",");
    info.numPhenotypes = pheno_ids.length;
    info.markedText = markedText;

    addCoreRenderers(info, 'annotate');

    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.pup_tent_css_libraries.push("/monarch-specific.css");
    info.pup_tent_css_libraries.push("/annotate.css");
    info.pup_tent_css_libraries.push("/imagehover.css");

    info.pup_tent_js_libraries.push("/tables.js");
    info.pup_tent_js_libraries.push("/stupidtable.js");

    info.title = "Annotation";
    info.hasResults = (info.results.length > 0);
    //return response.html(Mustache.to_html(getTemplate('annotate'), info));
    var output = pup_tent.render('annotate.mustache',info,'monarch_base.mustache');
    return response.html(output);
});

app.get('/annotate_minimal/text.:fmt?', function(request, fmt) {
    var q = request.params.q;

    var info =
        {
            query: q,
            longestOnly: request.params.longestOnly,
            results:[],
        };

    if (q == null || q == "") {
    }
    else {
        info.results = engine.annotateText(q, {longestOnly : request.params.longestOnly}).entities;
        info.results.forEach(function(r) {
            r.entity.label = r.entity.value;
        });
    }

    info.resultsTable = function() {return genTableOfAnnotateTextResults(info.results, 'obopurl'); } ;

    addCoreRenderers(info, 'annotate');
    info.hasResults = (info.results.length > 0);
    var output = pup_tent.render('annotate_minimal.mustache',info,'monarch_base.mustache');
    return response.html(output);
    //return response.html(Mustache.to_html(getTemplate('annotate_minimal'), info));
});

app.get('/sufficiency/basic.:fmt?', function(request, datatype, fmt) {
    var target = null;
    var info = {datatype: datatype, results:[]};
    var limit = 100;
    var input_items = getIdentifierList(request.params);
    input_items = engine.mapIdentifiersToPhenotypes( input_items );
    info.results = engine.getAnnotationSufficiencyScore(input_items);

    //info.input_items = resultObj.query_IRIs;
    info.input_items = input_items.join("\n");

    return response.json(info.results);
});

app.get('/scigraph/dynamic*.:fmt?', function(request) {
	//this presently is a scigraph pass-through wrapper, and only deals with json!
	//for example: /dynamic/homologs.json?gene_id=6469&homolog_id=RO_HOM0000000
    var path = request.pathInfo;

	//replace the "/dynamic" part of the path in the query
	path = path.replace(/.*\/?dynamic/,'');
    var params = request.params;

    var scigraph_results = engine.querySciGraphDynamicServices(path,params);

	return response.json(scigraph_results)


});

// proxy kegg api
app.get('/kegg/:operation/:arg1/:arg2?/:arg3?', function(request, operation, arg1, arg2, arg3) {
    var url = 'http://rest.kegg.jp/' + operation + '/' + arg1;
    if (arg2) url = url + '/' + arg2;
    if (arg3) url = url + '/' + arg3;

    var response = httpclient.get(url, {});
    var status = response.status;
    if (status == 200) {
        return {
            body: [response.content],
            headers: {'Content-Type': 'text/plain'},
            status: 200
        };
    } else {
        return {
            body: ["{error:true}"],
            headers: {'Content-Type': 'text/plain'},
            status: status
        };
    }


});

app.get('/admin/introspect.:fmt?', function(request, fmt) {

    var info = engine.introspect();

    // you can have any format you like, so long as it's json
    return response.json(info);
});

app.get('/admin/cache/info', function(request, fmt) {

    var info = {
        sizeInfo : engine.cache.sizeInfo(),
        cacheDirs : engine.cache.cacheDirs(),
        contents : engine.cache.contents().length
    };

    // you can have any format you like, so long as it's json
    return response.json(info);
});


// in theory anyone could access this and clear our cache slowing things down....
// we should make this authorized, not really a concern right now though
app.get('/admin/clear-cache', function(request) {
    engine.cache.clear(request.params.match);
    return response.html("Cleared!");
});

// A routing page different non-production demonstrations and tests.
app.get('/labs',
    function(request, page){
        var info = {};
        addCoreRenderers(info);
        info.pup_tent_css_libraries.push("/tour.css");
        info.title = 'Monarch Labs'
        //return response.html(Mustache.to_html(getTemplate('labs'), info));
        var output = pup_tent.render('labs.mustache', info,
				     'monarch_base.mustache');
        return response.html(output);
    });

//A routing page different non-production demonstrations and tests.
app.get('/labs/datagraph.:fmt?',function(request,fmt){
    
        var info = {};
        if (1!=1){
            var diseaseDist = engine.getDiseaseGeneDistro("DOID:7",6,true);
            var phenoDist = engine.getPhenotypeDistro("HP:0000118",6,true);
            var disPhenoDist = engine.getCacheFile('stats','disease-phenotype-distro');
            var phenoGenoDist = engine.getPhenotypeGenotypeDistro(
                    'HP:0000118',3,true,
                    'pheno-genotype-distro',
                    'fetchGenoPhenoAsAssociationsBySpecies'
            );
            var phenoGeneDist = engine.getPhenotypeGenotypeDistro(
                    'HP:0000118',1,true,
                    'pheno-gene-distro',
                    'getPhenotypeGeneCounts'
            );
            var phenoGenoDist = engine.getPhenotypeGenotypeDistro('HP:0000118',3,true);
        }
        
       /* var phenoGeneDist = engine.getPhenotypeGenotypeDistro(
                'HP:0000118',1,true,
                'pheno-gene-distro',
                'getPhenotypeGeneCounts'
        );*/
        
        var diseaseDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-disease-gene-distro.json'));
        var phenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-phenotype-annotation-distro.json'));
        var disPhenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-disease-phenotype-distro.json'));
        var phenoGenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-pheno-genotype-distro.json'));
        //var phenoGeneDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-pheno-gene-distro.json'));


        if (fmt != null) {
            return formattedResults(info,fmt,request);
        }

        addCoreRenderers(info);
        info.pup_tent_js_libraries.push("/BarChart.js");
        info.pup_tent_js_libraries.push("/graph_config.js");
        info.pup_tent_js_libraries.push("/datagraph.js");
        info.pup_tent_css_libraries.push("/datagraph.css");
        info.pup_tent_css_libraries.push("/monarch-labs.css");
        info.pup_tent_css_libraries.push("/monarch-specific.css");
        info.pup_tent_css_libraries.push("/monarch-main.css");
        info.pup_tent_css_libraries.push("/main.css");
        info.title = 'Monarch Diseases and Phenotypes';
        
        info.pup_tent_js_variables.push.apply(info.pup_tent_js_variables,
        [
            {name:'phenoDist',value:phenoDist.dataGraph},
            {name:'diseaseDist',value:diseaseDist.dataGraph},
            {name:'disPhenoDist',value:disPhenoDist.dataGraph},
            {name:'phenoGenoDist',value:phenoGenoDist.dataGraph}
        ]);
        info.monarch_launchable = [];
        info.monarch_launchable.push.apply(info.monarch_launchable,
        [
            //'makePhenotypeAnnotationGraph(phenoDist)',
            'makeTestGraph(phenoDist)',
            'makeDiseaseGeneGraph(diseaseDist)',
            'makePhenoGenoGraph(phenoGenoDist)',
            'makeDiseasePhenotypeGraph(disPhenoDist)'
        ]);

        //return response.html(Mustache.to_html(getTemplate('labs/datagraph'), info));
        var output = pup_tent.render('datagraph.mustache',info,'monarch_base.mustache');
        return response.html(output);
    });

// A routing page different non-production demonstrations and tests.
app.get('/labs/cy-path-demo',
    function(request, page){
        var info = {};
        addCoreRenderers(info);

        // Now add the stuff that we need to move forward.
        info.pup_tent_js_libraries.push("/bbop.js");
        info.pup_tent_js_libraries.push("/amigo_data_context.js");
        info.pup_tent_js_libraries.push("/cytoscape.js");
        info.pup_tent_js_libraries.push("/CytoDraw.js");
        info.pup_tent_js_libraries.push("/CyPathDemo.js");
        info.pup_tent_css_libraries.push("/monarch-labs.css");
        info.pup_tent_css_libraries.push("/tour.css");

        info.title = 'cy-path-demo';

        //return response.html(Mustache.to_html(getTemplate('labs/cy-path-demo'), info));
        var output = pup_tent.render('cy-path-demo.mustache',info,'monarch_base.mustache');
        return response.html(output);
    });

// A routing page different non-production demonstrations and tests.
app.get('/labs/cy-explore-demo',
    function(request, page){
        var info = {};
        addCoreRenderers(info);

        // Now add the stuff that we need to move forward.
        info.pup_tent_js_libraries.push("/bbop.js");
        info.pup_tent_js_libraries.push("/amigo_data_context.js");
        info.pup_tent_js_libraries.push("/cytoscape.js");
        info.pup_tent_js_libraries.push("/CytoDraw.js");
        info.pup_tent_js_libraries.push("/CyExploreDemo.js");
        info.pup_tent_css_libraries.push("/monarch-labs.css");
        info.pup_tent_css_libraries.push("/tour.css");

        //return response.html(Mustache.to_html(getTemplate('labs/cy-explore-demo'), info));

        info.title = 'cy-explore-demo';

        var output = pup_tent.render('cy-explore-demo.mustache',info,'monarch_base.mustache');
        return response.html(output);
    });

//Page for testing out chromosome visualization
app.get('/labs/chromosome-vis-demo',
    function(request, page){
        var info = {};
        
        var pup_tent_test = require('pup-tent')(
                ['js','css','templates','templates/labs',
                 'templates/page',
                 'widgets/datagraph/js',
                 'widgets/datagraph/css',
                 'widgets/phenogrid/js',
                 'widgets/phenogrid/css',
                 'widgets/keggerator/js',
                 'widgets/class-enrichment',
                 'conf' // get access to conf/golr-conf.json
        ]);
        info.pup_tent_js_libraries = [];
        info.pup_tent_css_libraries = [];
        
        // Override common css and js files,
        pup_tent_test.set_common('css_libs', []);
        pup_tent_test.set_common('js_libs', []);
        
        info.title = 'chromosome-vis-demo';
        
        info.pup_tent_js_libraries.push("/d3.min.js");
        info.pup_tent_js_libraries.push("/d3.min.js");
        info.pup_tent_js_libraries.push("/jquery-1.11.0.js");
        info.pup_tent_js_libraries.push("/jsdas.min.js");
        info.pup_tent_js_libraries.push("/angular-chromosome-vis.js");

        info.pup_tent_css_libraries.push("/angular-chromosome-vis.css")

        var output = pup_tent_test.render('chromosome-vis-demo.mustache',info);
        return response.html(output);
 });

// Playing around with remote resource/feed reading.
// TODO: If it gets /any/ more complicated, reform into an object.
function _get_now_sec(){ return Math.round((new Date()).getTime() / 1000); }
var _blog_data_last_step = 1800; // # sec until next download; 1/2hr
var _blog_data_last_time = _get_now_sec(); // one-time init
var _blog_data_last_res = [];
/**
 * Get blog data
 * @param {String} label - An optional label restricting blog posts.
 */
function _get_blog_data(label){

    // Only proceed if the time-since-last threshold is crossed or the
    // cached results are empty.
    var res = [];
    var now = _get_now_sec()
    if( (now -_blog_data_last_time) < _blog_data_last_step &&
    _blog_data_last_res.length > 0 ){
    // Used cached list
    engine.log('blog: using cached results');
    res = _blog_data_last_res;
    }else{
    engine.log('blog: get new results');

    // Grab off page.
    var base = 'http://monarch-initiative.blogspot.com';
  var catr = base + '/search/label/';
    var rsrc = base + '/feeds/posts/default?alt=rss';
  if (null != label) {
      rsrc = base + '/feeds/posts/default/-/' + label + '?alt=rss';
  }

    try {
        var http_client = require("ringo/httpclient");
        var exchange = http_client.get(rsrc);
        if( exchange && exchange.content ){
        var c = exchange.content;
        //engine.log('got: ' + got);

        // For E4X bug 336551.
        c = c.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "");
        var rss = new XML(c);
        if( rss && rss.channel && rss.channel.item ){
            for each( var item in rss.channel.item ) {
            //engine.log('prop: ' + item.title);

            // Date.
            var t = new Date(item.pubDate);
            var y = t.getFullYear();
            var m = t.getMonth();
            if( m < 10 ){ m = '0' + m; }
            var d = t.getDate();

            // Categories.
            var cats = [];
            for each( var cat in item.category ){
                cats.push({'label': cat, 'link': catr + cat});
            }

            res.push({
                'title': item.title,
                'description': item.description,
                'link': item.link,
                'category': cats,
                'date': [y, m, d].join('-')
            });
            }
        }
        //engine.log('xml: ' + rss);
        }
    }catch (e){
        engine.log('blog: error: ' + e);
    }finally{
        // No matter what, even if empty, update last attempt.
        _blog_data_last_res = res;
        _blog_data_last_time = now;
    }
    }
    return res;
}

function _sortByLabel(array) {
    if (array == null) return;
    array.sort(function(a, b){
            if (typeof a.label == 'undefined' || 
                typeof b.label == 'undefined' ){
                return 0;
            }
            var labelA=a.label.toLowerCase(), labelB=b.label.toLowerCase()
            if (labelA < labelB) //sort string ascending
              return -1
            if (labelA > labelB)
              return 1
            return 0 //default return value (no sorting)
              })
  return array;

}


app.get('/', function(request, page){

    // Rendering.
    var info = {};
    addCoreRenderers(info);
    
    // Overrides to addCoreRenderers().
    info.monarch_nav_search_p = false;
    info.monarch_extra_footer_p = true;

    // Now add the stuff that we need to move forward.
    //info.pup_tent_css_libraries.push("/bootstrap-glyphicons.css");
    info.pup_tent_css_libraries.push("/monarch-home.css");
    info.pup_tent_js_libraries.push("/HomePage.js");
    
    // Get blog data and render with vars.
    var blog_res = _get_blog_data();
    // Limit to X.
    var lim = 4;
    if( blog_res && blog_res.length > lim ){
        blog_res = blog_res.slice(0, lim);
    }
    info.blog_results = blog_res;
    info.title = 'Welcome to Monarch';
    var output = pup_tent.render('home-page.mustache', info,
				 'monarch-base-bs3.mustache');
    var res =  response.html(output);
    return res;
});

app.get('/labs/scratch-homepage', function(request, page){

    // Rendering.
    var info = {};
    addCoreRenderers(info);
    
    // Overrides to addCoreRenderers().
    info.monarch_nav_search_p = false;
    info.monarch_extra_footer_p = true;

    // Now add the stuff that we need to move forward.
    //info.pup_tent_css_libraries.push("/bootstrap-glyphicons.css");
    info.pup_tent_css_libraries.push("/monarch-home.css");
    info.pup_tent_js_libraries.push("/HomePage.js");
    
    //graph
    var phenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-phenotype-annotation-distro.json'));
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    info.pup_tent_js_libraries.push("/graph_config.js");
    info.pup_tent_js_libraries.push("/BarChart.js");
    info.pup_tent_js_variables.push({name:'globalDataGraph',value:phenoDist.dataGraph});
    info.monarch_launchable = [];
    info.monarch_launchable.push('makeHomePageGraph(globalDataGraph)');
    
    // Get blog data and render with vars.
    var blog_res = _get_blog_data();
    // Limit to X.
    var lim = 4;
    if( blog_res && blog_res.length > lim ){
        blog_res = blog_res.slice(0, lim);
    }
    info.blog_results = blog_res;
    info.title = 'Welcome to Monarch';
    var output = pup_tent.render('home-page-scratch.mustache', info,
                 'monarch-base-bs3.mustache');
    var res =  response.html(output);
    return res;
});

app.get('/labs/blog-test', function(request, page){

    // Rendering.
    var info = {};
    addCoreRenderers(info); 

    // Now add the stuff that we need to move forward.
    //info.pup_tent_css_libraries.push("/bootstrap-glyphicons.css");
    info.pup_tent_css_libraries.push("/monarch-labs.css");
    info.pup_tent_js_libraries.push("/BlogScratch.js");
    
    // Get blog data and render with vars.
    var blog_res = _get_blog_data();
    // Limit to X.
    var lim = 4;
    if( blog_res && blog_res.length > lim ){
        blog_res = blog_res.slice(0, lim);
    }
    info.blog_results = blog_res;
    info.title = 'Welcome to Monarch';
    var output = pup_tent.render('blog-scratch-test.mustache', info,
                 'blog-scratch-base.mustache');
    var res =  response.html(output);
    return res;
});

/*
 * GOLR REFACTOR
 */

function addGolrStaticFiles(info) {
    var golr_conf_raw = pup_tent.get('conf/golr-conf.json');
    var golr_conf_json = JSON.parse(golr_conf_raw);
    
    var xrefs_conf_raw = pup_tent.get('conf/xrefs.json');
    var xrefs_conf_json = JSON.parse(xrefs_conf_raw);

    //info.pup_tent_css_libraries.push("/bootstrap-glyphicons.css");
    //info.pup_tent_css_libraries.push("/monarch-labs.css");
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.pup_tent_css_libraries.push("/monarch-specific.css");
    info.pup_tent_css_libraries.push("/bbop.css");
    
    info.pup_tent_js_libraries.push("/bbop.min.js");
    //info.pup_tent_js_libraries.push("/amigo2.js");
    info.pup_tent_js_libraries.push("/golr-table.js");
    info.pup_tent_js_libraries.push("/stupidtable.min.js");
    info.pup_tent_js_libraries.push("/tables.js");
    
    info.pup_tent_js_variables.push({name:'global_app_base',
        value: engine.config.app_base});
    info.pup_tent_js_variables.push({name:'global_solr_url',
        value: engine.config.golr_url});
    info.pup_tent_js_variables.push({name:'global_golr_conf',
        value: golr_conf_json});
    info.pup_tent_js_variables.push({name:'global_xrefs_conf',
        value: xrefs_conf_json});
}

// query_field: e.g. subject_closure
function addGolrTable(info, query_field, id, div, filter) {
    
    //There has to be a better way
    var id_var = "query_id_" + bbop.core.uuid();
    var field_var = "query_field_" + bbop.core.uuid();
    var div_var = "query_div_" + bbop.core.uuid();
    var filt_var = "filter_" + bbop.core.uuid();
    var launch = '';
    
    id_var = id_var.replace('-','','g');
    field_var = field_var.replace('-','','g');
    div_var = div_var.replace('-','','g');
    filt_var = filt_var.replace('-','','g');
            
    info.pup_tent_js_variables.push({name: id_var, value: id});
    info.pup_tent_js_variables.push({name: field_var, value: query_field});
    info.pup_tent_js_variables.push({name: div_var, value: div});
    
    if (typeof info.monarch_launchable === 'undefined'){
        info.monarch_launchable = [];
    }
    
    if (typeof filter != 'undefined'){
        info.pup_tent_js_variables.push({name: filt_var, value: filter});
        launch = 'getTableFromSolr(' + id_var + ', ' + field_var + ', '
                                     + div_var + ', ' + filt_var + ')';
    } else {
        launch = 'getTableFromSolr(' + id_var + ', ' + field_var + ', '
                                     + div_var + ')';
    }
                     
    info.monarch_launchable.push(launch);
}


app.get('/labs/widget-scratch',
    function(request, page){

        // Rendering.
        var info = {};
        addCoreRenderers(info);

        addGolrTable(info, "subject_closure", id, 'bs3results');

        // Now add the stuff that we need to move forward.
        //info.pup_tent_css_libraries.push("/bootstrap-glyphicons.css");
        info.pup_tent_css_libraries.push("/monarch-labs.css");
        info.pup_tent_css_libraries.push("/bbop.css");
        info.pup_tent_js_libraries.push("/bbop.js");
        info.pup_tent_js_libraries.push("/amigo2.js");
        info.pup_tent_js_libraries.push("/WidgetScratch.js");

	//
        info.title = 'Widget Tests in Monarch';
        var output = pup_tent.render('widget-scratch.mustache', info,
                     'blog-scratch-base.mustache');
        var res =  response.html(output);
        return res;
 });

app.get('/phenotype/:id.:fmt?',
        function(request, id, fmt){

            engine.log("PhenotypeID= "+id);
            
            //Curify ID if needed
            if (/_/.test(id)){
                engine.log("ID contains underscore, replacing with : and redirecting");
                var newID = id.replace("_",":");
                return response.redirect(genURL('phenotype',newID));
            }

            // Rendering.
            var info = {};
            info = engine.fetchClassInfo(id, {level:1});
            
            if (fmt != null) {
                // TODO
                return formattedResults(info, fmt,request);
            }
            
            addCoreRenderers(info, 'phenotype', id);
            addGolrStaticFiles(info);
            
            //Load variables for client side tables
            var disease_filter = { field: 'subject_category', value: 'disease' };
            addGolrTable(info, "object_closure", id, 'disease-table', disease_filter );
            
            var gene_filter = { field: 'subject_category', value: 'gene' };
            addGolrTable(info, "object_closure", id, 'gene-table', gene_filter );
            
            var model_filter = { field: 'object_category', value: 'model' };
            addGolrTable(info, "subject_closure", id, 'model-table', model_filter );
            
            var variant_filter = { field: 'subject_category', value: 'variant' };
            addGolrTable(info, "object_closure", id, 'variant-table', variant_filter );
            
            var pathway_filter = { field: 'object_category', value: 'process' };
            addGolrTable(info, "subject_closure", id, 'pathway-table', pathway_filter );
            
            // Add templates
            info.includes.disease_anchor = addDiseaseAnchor(info);
            info.includes.disease_table = addDiseaseTable();
            
            // Add gene table
            info.includes.gene_anchor = addGeneAnchor(info);
            info.includes.gene_table = addGeneTable();
            
            // Add model table
            info.includes.model_anchor = addModelAnchor(info);
            info.includes.model_table = addModelTable();
            
            // Add variant table
            info.includes.variant_anchor = addVariantAnchor(info);
            info.includes.variant_table = addVariantTable();
            
            // Add pathway table
            info.includes.pathway_anchor = addPathwayAnchor(info);
            info.includes.pathway_table = addPathwayTable();
            
            if (typeof info.synonyms != 'undefined'){
                info.aka = info.synonyms.join(", ");
            }
            
            info.xrefs = function() {
                if (info.database_cross_reference != null) {
                return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
                //return info.database_cross_reference.join(", ");
                }
            };

            info.title = 'Monarch Phenotype: '+info.label+' ('+ info.id+')';
            
            // variables checking existence of data in sections
            info.hasDef = function() {return checkExistence(info.definitions)};
            info.hasAka = function() {return checkExistence(info.synonyms)};
            info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};
            info.hasDiseases = function() {return checkExistence(info.disease_associations)};
            info.hasGenes = true;
            info.hasGenotypes = function() {return checkExistence(info.genotype_associations)};
            info.hasLiterature = function() {return checkExistence(info.literature)};

            info.diseaseNum = function() {return getNumLabel(info.disease_associations)};
            info.geneNum = function() {
                if (info.gene_associations != null) {
                    return getNumLabel(engine.unique(info.gene_associations.map(function(g) {return g.gene.id})))};
                return 0;
                };

            info.genotypeNum = function() {return getNumLabel(info.genotype_associations)};
            info.literatureNum = function() {return getNumLabel(info.pmidinfo)};

            // adorn object with rendering functions
            info.diseaseTable = function() {return genTableOfDiseasePhenotypeAssociations(info.disease_associations)} ;
            info.geneTable = function() {return genTableOfGenePhenotypeAssociations(info.gene_associations)};
            info.genotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.genotype_associations)};
            info.literatureTable = function() {return genTableOfLiterature(info.literature, info.pmidinfo)};

            var output = pup_tent.render('phenotype.mustache', info,
                                         'monarch_base.mustache');
            return response.html(output);
            return res;
 });

//PHENOTYPE - Sub-pages
//Example: /phenotype/MP_0000854/phenotype_associations.json
//Currently only works for json or rdf output
app.get('/phenotype/:id/:section.:fmt?', function(request, id, section, fmt) {

 var info = engine.fetchClassInfo(id, {level:1});

 var sectionInfo =
     { id: "obo:"+id }; // <-- TODO - unify ID/URI strategy
 sectionInfo[section] = info[section];
 engine.addJsonLdContext(sectionInfo);

 if (fmt != null) {
     return formattedResults(sectionInfo, fmt,request);
 }
 else {
     return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
 }
});


app.get('/disease/:id.:fmt?',
        function(request, id, fmt){
    
        try {
            engine.log("getting /disease/:id where id="+id);
            
            //Curify ID if needed
            if (/_/.test(id)){
                engine.log("ID contains underscore, replacing with : and redirecting");
                var newID = id.replace("_",":");
                return response.redirect(genURL('disease',newID));
            }

            // Rendering.
            var info = {};
            info = engine.fetchClassInfo(id, {level:1});
            
            if (fmt != null) {
                return formattedResults(info, fmt,request);
            }
            
            addCoreRenderers(info, 'disease', id);
                        
            addGolrStaticFiles(info);
            
            //Load variables for client side tables
            var phenotype_filter = { field: 'object_category', value: 'phenotype' };
            addGolrTable(info, "subject_closure", id, 'phenotypes-table', phenotype_filter );
            
            var gene_filter = { field: 'subject_category', value: 'gene' };
            addGolrTable(info, "object_closure", id, 'gene-table', gene_filter );
            
            var model_filter = { field: 'object_category', value: 'model' };
            addGolrTable(info, "subject_closure", id, 'model-table', model_filter );
            
            var variant_filter = { field: 'subject_category', value: 'variant' };
            addGolrTable(info, "object_closure", id, 'variant-table', variant_filter );
            
            var pathway_filter = { field: 'object_category', value: 'process' };
            addGolrTable(info, "subject_closure", id, 'pathway-table', pathway_filter );
            
            // Phenogrid
            addPhenogridFiles(info);
            info.pup_tent_js_libraries.push("/phenogridloader-no-species.js");
            
            // Add templates
            info.includes.phenotype_anchor = addPhenotypeAnchor(info);
            info.includes.phenotype_table = addPhenotypeTable();
            
            // Add gene table
            info.includes.gene_anchor = addGeneAnchor(info);
            info.includes.gene_table = addGeneTable();
            
            // Add model table
            info.includes.model_anchor = addModelAnchor(info);
            info.includes.model_table = addModelTable();
            
            // Add variant table
            info.includes.variant_anchor = addVariantAnchor(info);
            info.includes.variant_table = addVariantTable();
            
            // Add pathway table
            info.includes.pathway_anchor = addPathwayAnchor(info);
            info.includes.pathway_table = addPathwayTable();

            info.title = 'Monarch Disease: '+info.label+' ('+ info.id+')';

            info.primary_xref = function() {return genExternalHref('source',{id : id})};
        
            if (typeof info.synonyms != 'undefined'){
                info.aka = info.synonyms.join(", ");
            }
            
            info.xrefs = function() {
                if (info.database_cross_reference != null) {
                    return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
                    //return info.database_cross_reference.join(", ");
                }
            };
            info.altids = function() {
                if (info.has_alternative_id != null) {
                    return info.has_alternative_id.join(", ");
                }
            }
            
            //info.hasHeritability = function() {return checkExistence(info.heritability)};
            //info.heritability = engine.unique(info.heritability.map(function(h) {return h.inheritance.label})).join(", "); 

            // variables checking existence of data in sections
            info.hasDef = function() {return checkExistence(info.definitions)};
            info.hasComment = function() {return checkExistence(info.comment)};
            info.hasAka = function() {return checkExistence(info.synonyms)};
            info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};
            info.hasPhenotypes = true;
            info.includes.phenogrid_anchor = Mustache.to_html(getTemplate('phenogrid-anchor'), info);
            
            var output = pup_tent.render('disease.mustache', info,
                                         'monarch_base.mustache');
            return response.html(output);
            
        } catch(err) {
            return errorResponse(err);
        }
 });

//DISEASE - Sub-pages
//Example: /disease/DOID_12798/phenotype_associations.json
//Currently only works for json or rdf output
app.get('/disease/:id/:section.:fmt?', function(request, id, section, fmt) {
    var newId = engine.resolveClassId(id);
    if (newId != id) {
        engine.log("redirecting: "+id+" ==> "+newId);
        return response.redirect(genURL('disease',newId));
    }

    var info = engine.fetchCoreDiseaseInfo(id);

    var sectionInfo =
         { id: "obo:"+id }; // <-- TODO - unify ID/URI strategy
    sectionInfo[section] = info[section];
    engine.addJsonLdContext(sectionInfo);

    if (fmt != null) {
        return formattedResults(sectionInfo, fmt,request);
    } else {
        return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
    }
});

var fetchFeatureSection = function(request, id, section, fmt) {
    console.log(request + ' ' + id + ' ' + section + ' ' + fmt);
    var info = engine.fetchCoreGeneInfo(id);

    var sectionInfo =
        { id: "obo:"+id }; // <-- TODO - unify ID/URI strategy
    sectionInfo[section] = info[section];
    engine.addJsonLdContext(sectionInfo);

    if (fmt != null) {
        return formattedResults(sectionInfo, fmt,request);
    } else {
        return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
    }
}

var fetchFeaturePage = function(request, id, fmt) {
    try {

        // Rendering.
        var info = {};
        info = engine.fetchDataInfo(id);
        
        if (fmt != null) {
            return formattedResults(info, fmt,request);
        }
        
        addCoreRenderers(info, 'gene', id);
        addGolrStaticFiles(info);
        
        //Load variables for client side tables
        var phenotype_filter = { field: 'object_category', value: 'phenotype' };
        addGolrTable(info, "subject_closure", id, 'phenotypes-table', phenotype_filter);
        
        var disease_filter = { field: 'object_category', value: 'disease' };
        addGolrTable(info, "subject_closure", id, 'disease-table', disease_filter);
        
        var model_filter = { field: 'object_category', value: 'model' };
        addGolrTable(info, "subject_closure", id, 'model-table', model_filter );
        
        var variant_filter = { field: 'subject_category', value: 'variant' };
        addGolrTable(info, "object_closure", id, 'variant-table', variant_filter );
        
        var homolog_filter = { field: 'object_category', value: 'gene' };
        addGolrTable(info, "subject_closure", id, 'homolog-table', homolog_filter );
        
        var pathway_filter = { field: 'object_category', value: 'process' };
        addGolrTable(info, "subject_closure", id, 'pathway-table', pathway_filter );
        
        // Phenogrid
        addPhenogridFiles(info);
        info.pup_tent_js_libraries.push("/phenogridloader-no-species.js");
        
        // Add templates
        info.includes.phenotype_anchor = addPhenotypeAnchor(info);
        info.includes.phenotype_table = addPhenotypeTable();
        
        // Add gene table
        info.includes.disease_anchor = addDiseaseAnchor(info);
        info.includes.disease_table = addDiseaseTable();
        
        // Add model table
        info.includes.model_anchor = addModelAnchor(info);
        info.includes.model_table = addModelTable();
        
        // Add variant table
        info.includes.variant_anchor = addVariantAnchor(info);
        info.includes.variant_table = addVariantTable();
        
        // Add pathway table
        info.includes.homolog_anchor = addHomologAnchor(info);
        info.includes.homolog_table = addHomologTable();
        
        // Add pathway table
        info.includes.pathway_anchor = addPathwayAnchor(info);
        info.includes.pathway_table = addPathwayTable();

        info.title = 'Monarch Gene: '+info.label+' ('+ info.id+')';

        info.primary_xref = function() {return genExternalHref('source',{id : id})};
    
        if (typeof info.synonyms != 'undefined'){
            info.aka = info.synonyms.join(", ");
        }
        
        info.xrefs = function() {
            if (info.database_cross_reference != null) {
                return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
                //return info.database_cross_reference.join(", ");
            }
        };
        info.altids = function() {
            if (info.has_alternative_id != null) {
                return info.has_alternative_id.join(", ");
            }
        }

        // variables checking existence of data in sections
        info.hasDef = function() {return checkExistence(info.definitions)};
        info.hasComment = function() {return checkExistence(info.comment)};
        info.hasAka = function() {return checkExistence(info.synonyms)};
        info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};
        info.hasPhenotypes = true;
        
        info.includes.phenogrid_anchor = Mustache.to_html(getTemplate('phenogrid-anchor'), info);
        
        var output = pup_tent.render('gene.mustache', info,
                 'monarch_base.mustache');
        return response.html(output);
        
    } catch(err) {
        return errorResponse(err);
    }
    
}
//Note there is much copied from the above function, should refactor to not repeat code, epic DRY violation
var fetchVariantPage = function(request, id, fmt) {
    try {

        // Rendering.
        var info = {};
        info = engine.fetchDataInfo(id);
        
        if (fmt != null) {
            return formattedResults(info, fmt,request);
        }
        
        addCoreRenderers(info, 'variant', id);
        addGolrStaticFiles(info);
        
        //Load variables for client side tables
        var phenotype_filter = { field: 'object_category', value: 'phenotype' };
        addGolrTable(info, "subject_closure", id, 'phenotypes-table', phenotype_filter);
        
        var disease_filter = { field: 'object_category', value: 'disease' };
        addGolrTable(info, "subject_closure", id, 'disease-table', disease_filter);
        
        var model_filter = { field: 'object_category', value: 'model' };
        addGolrTable(info, "subject_closure", id, 'model-table', model_filter );
        
        var pathway_filter = { field: 'object_category', value: 'process' };
        addGolrTable(info, "subject_closure", id, 'pathway-table', pathway_filter );
        
        // Phenogrid
        addPhenogridFiles(info);
        info.pup_tent_js_libraries.push("/phenogridloader-no-species.js");
        
        // Add templates
        info.includes.phenotype_anchor = addPhenotypeAnchor(info);
        info.includes.phenotype_table = addPhenotypeTable();
        
        // Add gene table
        info.includes.disease_anchor = addDiseaseAnchor(info);
        info.includes.disease_table = addDiseaseTable();
        
        // Add model table
        info.includes.model_anchor = addModelAnchor(info);
        info.includes.model_table = addModelTable();
        
        // Add pathway table
        info.includes.pathway_anchor = addPathwayAnchor(info);
        info.includes.pathway_table = addPathwayTable();

        info.title = 'Monarch Variant: '+info.label+' ('+ info.id+')';

        info.primary_xref = function() {return genExternalHref('source',{id : id})};
    
        if (typeof info.synonyms != 'undefined'){
            info.aka = info.synonyms.join(", ");
        }
        
        info.xrefs = function() {
            if (info.database_cross_reference != null) {
                return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
                //return info.database_cross_reference.join(", ");
            }
        };
        info.altids = function() {
            if (info.has_alternative_id != null) {
                return info.has_alternative_id.join(", ");
            }
        }

        // variables checking existence of data in sections
        info.hasDef = function() {return checkExistence(info.definitions)};
        info.hasComment = function() {return checkExistence(info.comment)};
        info.hasAka = function() {return checkExistence(info.synonyms)};
        info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};
        info.hasPhenotypes = true;
        
        info.includes.phenogrid_anchor = Mustache.to_html(getTemplate('phenogrid-anchor'), info);
        
        var output = pup_tent.render('variant.mustache', info,
                 'monarch_base.mustache');
        return response.html(output);
        
    } catch(err) {
        return errorResponse(err);
    }
    
}


app.get('/gene/:id.:fmt?', fetchFeaturePage);
app.get('/variant/:id.:fmt?', fetchVariantPage);

//Sequence Feature - Sub-pages
//Example: /gene/NCIBGene:12166/phenotype_associations.json
//Currently only works for json or rdf output
app.get('/gene/:id/:section.:fmt?',fetchFeatureSection);
app.get('/variant/:id/:section.:fmt?',fetchFeatureSection);
app.get('/genotype/:id/:section.:fmt?', fetchFeatureSection);
app.get('/model/:id/:section.:fmt?', fetchFeatureSection);

function addPhenotypeAnchor(info) {
    var phenotype_anchor = {id: info.id, type: "Phenotypes", href: "phenotypes"};
    return Mustache.to_html(getTemplate('anchor'), phenotype_anchor);
}

function addPhenotypeTable() {
    var phenotype_table = {href: "phenotypes", div: "phenotypes-table"};
    return Mustache.to_html(getTemplate('golr-table'), phenotype_table);
}

function addDiseaseAnchor(info) {
    var disease_anchor = {id: info.id, type: "Disease", href: "diseases"};
    return Mustache.to_html(getTemplate('anchor'), disease_anchor);
}

function addDiseaseTable() {
    var disease_table = {href: "diseases", div: "disease-table"};
    return Mustache.to_html(getTemplate('golr-table'), disease_table);
}

function addGeneAnchor(info) {
    var gene_anchor = {id: info.id, type: "Genes", href: "genes"};
    return Mustache.to_html(getTemplate('anchor'), gene_anchor);
}

function addGeneTable() {
    var gene_table = {href: "genes", div: "gene-table"}
    return Mustache.to_html(getTemplate('golr-table'), gene_table);
}

function addModelAnchor(info) {
    var model_anchor = {id: info.id, type: "Models", href: "models"};
    return Mustache.to_html(getTemplate('anchor'), model_anchor);
}

function addModelTable() {
    var model_table = {href: "models", div: "model-table"};
    return Mustache.to_html(getTemplate('golr-table'), model_table);
}

function addVariantAnchor(info) {
    var variant_anchor = {id: info.id, type: "Variants", href: "variants"};
    return Mustache.to_html(getTemplate('anchor'), variant_anchor);
}

function addVariantTable() {
    var variant_table = {href: "variants", div: "variant-table"};
    return Mustache.to_html(getTemplate('golr-table'), variant_table);
}

function addHomologAnchor(info) {
    var homolog_anchor = {id: info.id, type: "Homologs", href: "homologs"};
    return Mustache.to_html(getTemplate('anchor'), homolog_anchor);
}

function addHomologTable() {
    var homologs_table = {href: "homologs", div: "homolog-table"};
    return Mustache.to_html(getTemplate('golr-table'), homologs_table);
}

function addPathwayAnchor(info) {
    var pathway_anchor = {id: info.id, type: "Pathways", href: "pathways"};
    return Mustache.to_html(getTemplate('anchor'), pathway_anchor);
}

function addPathwayTable() {
    var pathway_table = {href: "pathways", div: "pathway-table"};
    return Mustache.to_html(getTemplate('golr-table'), pathway_table);
}


/*
 * END GOLR REFACTOR
 */


app.get('/labs/people-scratch', function(request, page){

    // Rendering.
    var info = {};
    addCoreRenderers(info);
    
    // Now add the stuff that we need to move forward.
    info.pup_tent_css_libraries.push("/monarch-labs.css");
    info.pup_tent_css_libraries.push("/bbop.css");
    info.pup_tent_js_libraries.push("/bbop.js");
    info.pup_tent_js_libraries.push("/amigo2.js");
    info.pup_tent_js_libraries.push("/PeopleScratch.js");
    info.monarch_launchable.push("PeopleInit()");
    
    //
    info.title = 'People Tests in Monarch';
    var output = pup_tent.render('people-scratch.mustache', info,
				 'monarch-base-bs3.mustache');
    var res =  response.html(output);
    return res;
});

///
/// Routes for a demonstration of JBrowse in Monarch.
///

// Deliver content from directory mapped to path.
app.get('/labs/jbrowse/*', function(request){

    // Extract path from request.
    var path = request.pathInfo;
    path = path.substr('/labs/jbrowse/'.length, path.length) || '';

    // Map path onto filesystem.
    //var fs_loc = './'; // root dir
    var fs_loc = './templates/labs/jbrowse/'; // root dir
    var mapped_path = fs_loc + path;

    // Return file/content.
    //var res =  response.html('<em>' + path + ': not found</em>'); // default err
    //def ctype = _decide_content_type(path)
    //var res =  response.html('<em>' + fs.Path(mapped_path).absolute()+ ': not found</em>'); // default err
    //if( fs.exists(path) ){
    //    res = _return_mapped_content(path);
    if( fs.exists(mapped_path) ){
        var res = _return_mapped_content(mapped_path);
        return res ;
    }
    else{
        var res =  response.html('<em>' + fs.Path(mapped_path).absolute()+ ': not found</em>'); // default err
        res.status =  404 ;
        return res ;
    }
});
// Deliver content from directory mapped to path.
app.get('/labs/jbrowse-demo', function(request){

    // Rendering variables.
    var info = {};
    addCoreRenderers(info);
    info.title = 'Welcome to Monarch';

    // Final render.
    var output = pup_tent.render('jbrowse.mustache', info,
                 'blog-scratch-base.mustache');
    var res =  response.html(output);
    return res;
});

///
/// Error handling.
///

// Add an error for all of the rest.
app.get('/*',function(request) {
    var info = {};
    addCoreRenderers(info);
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.title = 'Page Not Found';
    var output = pup_tent.render('notfound.mustache',info,'monarch_base.mustache');
    var res =  response.html(output);
    //var res = response.html(Mustache.to_html(getTemplate('notfound'),info));
    res.status = 404;
    return res;
});


// INITIALIZATION
// Can set port from command line. E.g. --port 8080
if (require.main == module) {
   require('ringo/httpserver').main(module.id);
}


//TODO Delete
app.get('/labs/gene/:id.:fmt?', function(request, id, fmt) {

    //Redirect to NCBI Gene ID
    var mappedID = getGeneMapping(id);
    if (typeof mappedID != 'undefined' && mappedID != id){
        engine.log("found updated ID, redirecting to: "+mappedID);
        return response.redirect(genURL('gene',mappedID));
    }

    var info;
    try {
        info = engine.fetchGeneInfo(id);
    }
    catch(err) {
        return errorResponse(err);
    }

    if (fmt != null) {
        return formattedResults(info,fmt,request);
    }

    // HTML
    addCoreRenderers(info, 'gene', id);

    //Add pup_tent libs
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.pup_tent_css_libraries.push("/monarch-specific.css");
    info.pup_tent_css_libraries.push("/imagehover.css");
    
    info.pup_tent_css_libraries.push("/phenogrid.css");

    info.pup_tent_js_libraries.push("/stupidtable.min.js");
    info.pup_tent_js_libraries.push("/tables.js");
    addPhenogridFiles(info);

    info.pup_tent_js_libraries.push("/phenogridloader-no-species.js");

    info.title = 'Monarch Gene: '+info.label+' ('+ info.id+')';

    // variables checking existence of data in sections
    info.hasPhenotypes   = function() {return checkExistence(info.phenotype_associations)};
    info.hasPathways     = function() {return checkExistence(info.pathway_associations)};
    info.hasDiseases     = function() {return checkExistence(info.disease_associations)};
    info.hasGenotypes    = function() {return checkExistence(info.genotype_associations)};
    info.hasLocation     = function() {return checkExistence(info.location)};
    info.hasAlleles      = function() {return checkExistence(info.alleles)};
    info.hasOrthologs    = function() {return checkExistence(info.orthologs)};
    info.hasInteractions = function() {return checkExistence(info.interactions)};
    info.hasSummary      = function() {return checkExistence(info.summary)};
    info.hasLiterature   = function() {return checkExistence(info.literature)};
    info.hasSynonym   = function() {return checkExistence(info.synonyms)};

    //info.phenotypeNum = function() {return getNumLabel(info.phenotype_associations)};
    info.phenotypeNum = function() {
        if (info.phenotype_associations != null) {
            return getNumLabel(engine.unique(info.phenotype_associations.map(function(p) {return p.phenotype.id})))};
        return 0;
    };

    info.genotypeNum    = function() {return getNumLabel(info.genotype_associations)};
    info.pathwayNum     = function() {return getNumLabel(info.pathway_associations)};
    info.diseaseNum     = function() {return getNumLabel(info.disease_associations)};
    info.alleleNum      = function() {return getNumLabel(info.alleles)};
    info.orthologNum    = function() {return getNumLabel(info.orthologs)};
    info.interactionNum = function() {return getNumLabel(info.interactions)};
    info.literatureNum  = function() {return getNumLabel(info.pmidinfo)};

    // adorn object with rendering functions
    info.phenotypeTable   = function() {return genTableOfGenePhenotypeAssociations(info.phenotype_associations);};
    info.pathwayTable     = function() {return genTableOfGenePathwayAssociations(info.pathway_associations);};
    info.diseaseTable     = function() {return genTableOfGeneDiseaseAssociations(info.disease_associations);};
    info.genotypeTable    = function() {return genTableOfGeneGenotypeAssociations(info.genotype_associations);};
    info.alleleTable      = function() {return genTableOfGeneAlleleAssociations(info.alleles);};
    info.orthologTable    = function() {return genTableOfGeneOrthologAssociations(info.orthologs);};
    info.interactionTable = function() {return genTableOfGeneInteractionAssociations(info.interactions);};
    info.literatureTable  = function() {return genTableOfLiterature(info.literature, info.pmidinfo);};

    info.primary_xref = function() {return genExternalHref('source',{id : info.id})};
    info.xrefTable    = function() {return genTableOfGeneXRefs(info.xrefs);};

    info.annotationScore = function() {
        if (info.annotation_sufficiency != null) {
            return (5 * info.annotation_sufficiency);
        } else {
            return 0;
        }
    };

    //Link out to NCBI
    info.taxon_xref;

    if (info.taxon){
        info.taxon_xref = function() {return genExternalHref('source',info.taxon)};
    }

    var output = pup_tent.render('gene-jbrowse.mustache',info,'monarch_base.mustache');
    return response.html(output);
    //return response.html(Mustache.to_html(getTemplate('gene'), info));
});

 // TODO: delete
 app.get('/labs/phenotype/:id.:fmt?', function(request, id, fmt) {

     // TEMPORARY. Remove when this resolved: https://github.com/monarch-initiative/monarch-app/issues/246
     if (id.indexOf("ZP") == 0) {

         var info = {
             message: "Zebrafish phenotypes are currently under construction"
         };
         addCoreRenderers(info);
         info.title = info.message;
         info.pup_tent_css_libraries.push("/monarch-main.css");
         var output = pup_tent.render('underconstruction.mustache',info,'monarch_base.mustache');
         var res =  response.html(output);
         //var res = response.html(Mustache.to_html(getTemplate('underconstruction'),info));
         res.status = 404;
         return res;

     }

     try {
         var info = engine.fetchPhenotypeInfo(id);

         // TEMPORARY - see https://github.com/monarch-initiative/monarch-app/issues/246
         if (info.genotype_associations != null) {
             info.genotype_associations = info.genotype_associations.filter(function(a){return a.has_genotype.id != null && a.has_genotype.id.indexOf("ZFIN") == -1});
         }

         if (fmt != null) {
             return formattedResults(info, fmt,request);
         }

         addCoreRenderers(info, 'phenotype', id);

         //Add pup_tent libs
         info.pup_tent_css_libraries.push("/monarch-main.css");
         info.pup_tent_css_libraries.push("/monarch-specific.css");

         info.pup_tent_js_libraries.push("/stupidtable.min.js");
         info.pup_tent_js_libraries.push("/tables.js");
         //info.pup_tent_js_libraries.push("/api.js");

         info.title = 'Monarch Phenotype: '+info.label+' ('+ info.id+')';

         if (typeof info.synonyms != 'undefined'){
             info.aka = info.synonyms.join(", ");
         }
         
         info.xrefs = function() {
             if (info.database_cross_reference != null) {
                 return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
                 //return info.database_cross_reference.join(", ");
             }
         };


         // variables checking existence of data in sections
         info.hasDef = function() {return checkExistence(info.definitions)};
         info.hasAka = function() {return checkExistence(info.synonyms)};
         info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};
         info.hasDiseases = function() {return checkExistence(info.disease_associations)};
         info.hasGenes = function() {return checkExistence(info.gene_associations)};
         info.hasGenotypes = function() {return checkExistence(info.genotype_associations)};
         info.hasLiterature = function() {return checkExistence(info.literature)};

         info.diseaseNum = function() {return getNumLabel(info.disease_associations)};
         info.geneNum = function() {
             if (info.gene_associations != null) {
                 return getNumLabel(engine.unique(info.gene_associations.map(function(g) {return g.gene.id})))};
             return 0;
         };

         info.genotypeNum = function() {return getNumLabel(info.genotype_associations)};
         info.literatureNum = function() {return getNumLabel(info.pmidinfo)};

         // adorn object with rendering functions
         info.diseaseTable = function() {return genTableOfDiseasePhenotypeAssociations(info.disease_associations)} ;
         info.geneTable = function() {return genTableOfGenePhenotypeAssociations(info.gene_associations)};
         info.genotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.genotype_associations)};
         info.literatureTable = function() {return genTableOfLiterature(info.literature, info.pmidinfo)};


         // TODO: should be from a canonical internal source
         //info.gene_set = {} ;
         //for(var gene_association_index in info.gene_associations) {
         //    var gene_object = info.gene_associations[gene_association_index];
         //    info.gene_set[gene_object.gene.id] = gene_object.gene.label ;
         //
         //}

         // TODO: need to get the local context
         //var base_url = "http://monarchinitiative.org";
         //var url ;
         //info.location_set = {} ;
         //for(var gene_id_index in info.gene_set){
         //    console.log(gene_id_index);
         //    url = base_url +"/gene/"+gene_id_index+".json";
         //
         //    var ret = engine.fetchUrl(url);
         //    var location = JSON.parse(ret).location;
         //    if(typeof location != 'undefined'){
         //        console.log("LOCATION: " + location);
         //        location =  location.substring(0,location.search(/[pq]/));
         //        if(info.location_set[location]==null){
         //           info.location_set[location]  = [] ;
         //        }
         //        info.location_set[location].push(info.gene_set[gene_id_index]);
         //        console.log("ADDED LOCATION: " + location + "  with id "+JSON.stringify(info.location_set[location]));
         //    }
         //}

         // TODO: this is the wrong place for this type of method
         //info.jbrowse_table = "";
         //for(var chr in info.location_set){
         //    info.jbrowse_table += "<tr>";
         //    info.jbrowse_table += "<td>chr" + chr + "</td>";
         //    info.jbrowse_table += "<td>";
         //    //info.jbrowse_table += info.location_set[chr].join(',');
         //    //info.jbrowse_table += "<iframe  width=600 height=200 src='";
         //    //info.jbrowse_table += "http://icebox.lbl.gov/WebApolloHuman/jbrowse/?tracklist=0&tracks=OGS-GRCh38&loc=chr"+chr+"&selected="+info.location_set[chr].join(',')+"'></iframe>";
         //
         //    info.jbrowse_table += "</td>";
         //
         //    info.jbrowse_table += "</tr>"
         //}
         //info.jbrowse_table += "";

         // for each gene, get the chromosome object
         //console.log(Object.keys(info.gene_set).length);
         //console.log(info.gene_set.length) ;

         var output = pup_tent.render('phenotype-jbrowse.mustache',info,'monarch_base.mustache');
         return response.html(output);
         //return response.html(Mustache.to_html(getTemplate('phenotype'), info));
     }
     catch(err) {
         return errorResponse(err);
     }
 });
 
 app.post('/analyze/:datatype.:fmt?', function(request, datatype, fmt) {
     
     var info = {};
     //Some hardcoded things for mustache
     info.hasInputItems = false;
     info.hasResults = false;
     info.hasTable = false;
     info.datatype = datatype;
     info.isFileError = false;
     info.limit = 100;
     
     /* Uploads are streamed to a tmp file using the custom upload function
      * above.  This function checks the content-length and prevents the
      * tmp file from being written for files over 50 mb.  Here we check
      * this again before writing the contents to memory and returning this
      * to the client.  With either check, if the file exceeds 50 mb we 
      * set doesFileExceedMax to true which is utilized by mustache to
      * display the error to the user
      */
     
     var user_request;
     
     if (typeof request.params.file_exceeds != 'undefined'){
         info.doesFileExceedMax = true;
         info.isFileError = true;
     } else if (typeof request.params.upload_file != 'undefined'){
         var fileUpload = request.params.upload_file;
         // File hit hard size limit when writing but for some reason
         // wasn't caught in the content-length
         if (request.params.hit_limit){
             fs.remove(fileUpload.tempfile);
             info.doesFileExceedMax = true;
             info.isFileError = true;
         } else {
             user_request = fs.read(fileUpload.tempfile);
             fs.remove(fileUpload.tempfile);
             info.hasInputItems = true;
         }
     } else if (typeof request.params.user_results != 'undefined') {
         user_request = request.params.user_results;
         info.hasInputItems = true;
     }
     
     //Try parsing JSON, if this fails show error to user
     if (typeof user_request != 'undefined'){
         try {
             JSON.parse(user_request);
         } catch (err) {
             info.isFileError = true;
             info.isJSONIllegal = true;
             info.hasInputItems = false;
             info.jsonError = String(err).replace(/\(.*/,'');
             user_request = '';
         }
     }
     
     if (datatype ==='phenotypes') {
         info.isPhenotype='True';
     }

     addCoreRenderers(info, 'analyze', datatype);

     //Add pup_tent libs
     info.pup_tent_css_libraries.push("/monarch-main.css");
     info.pup_tent_css_libraries.push("/monarch-specific.css");
     info.pup_tent_css_libraries.push("/imagehover.css");
     info.pup_tent_css_libraries.push("/phenogrid.css");

     info.pup_tent_js_libraries.push("/Analyze.js");
     addPhenogridFiles(info);
     info.pup_tent_js_libraries.push("/stupidtable.min.js");
     info.pup_tent_js_libraries.push("/tables.js");
     
     info.pup_tent_js_variables.push.apply(info.pup_tent_js_variables,
             [
                 {name:'user_input',value: user_request}
             ]);
     info.monarch_launchable = [];
     info.monarch_launchable.push.apply(info.monarch_launchable,
             [
                 'AnalyzeInit(user_input)'
             ]);

     info.title = 'Monarch Analysis';

     var output = pup_tent.render('analyze.mustache',info,'monarch_base.mustache');
     return response.html(output);
 });
 
 app.get('/analyze/:datatype.:fmt?', function(request, datatype, fmt) {
     var target = request.params.target;
     var species = request.params.target_species;
     var mode = request.params.mode;

     var tf = {};

     // deprecated: it is no longer possible to get a 'target' param from
     // the analyze form. However, we support legacy URLs for query results.
     // (mostly for test purposes)
     if (target == "" || target == "All") {
         target = null;
     }
     else {
         engine.warn("Use of target as a parameter is deprecated");
         tf.target = target;
     }

     if (species == "" || species == "All" || typeof species === 'undefined') {
         species = null;
     }
     else {
         tf.species = species;
     }

     engine.log("analyze...datatype is ..."+datatype);
     engine.log("Target="+target); // deprecated
     engine.log("Species="+species);
     engine.log("ResultFilter="+JSON.stringify(tf));
     var info =
         {
             target_filter : tf,
             datatype: datatype,
             results:[]
         };
     var limit = 100;

     if (request.params.input_items != null) {
         engine.log("request params are ..."+JSON.stringify(request.params));
         var input_items = getIdentifierList(request.params);
         var splitLabels;
         //Grabs labels for IDs
         for (var spn = 0; spn < input_items.length; spn++) {
             if (input_items[spn]){
         var phenoInfo = engine.fetchClassInfo(input_items[spn],{level:0})
                 if (phenoInfo.label) {
                     if (splitLabels){
                         splitLabels += "+"+phenoInfo.label;
                     }else{
                         splitLabels = phenoInfo.label;
                     }
                 }
             }
         }
         info.splitLabels = splitLabels;
         input_items = engine.mapIdentifiersToPhenotypes( input_items ).join().split(',');
         engine.log("input items...."+JSON.stringify(input_items));
         engine.log("# of input items..."+input_items.length);
         limit = request.params.limit;


     var resultObj = engine.searchByAttributeSet(input_items, tf, limit);
         info.results = resultObj.results;
         engine.log("ResultsInput: "+info.results.length);

         //info.input_items = resultObj.query_IRIs;
         info.input_items = input_items.join(" ");
         info.hasInputItems = true;

         info.target_species=species;
     } else if (typeof request.params.user_results !== 'undefined') {
         info.hasInputItems = true;
     } else {
         info.hasInputItems = false;
     }
     if (fmt != null) {
         return formattedResults(info,fmt,request);
     }
     info.limit = limit;

     info.singleSpecies = true;
     
     if (info.target_species === null || species === null || info.target_species == "") {
         info.singleSpecies = false;
     }

     if (info.singleSpecies) {
         info.speciesHref = genExternalHref('source', engine.mapSpeciesIdentifierToTaxon(info.target_species))
     }
     
     if ((mode == 'compare') || (typeof request.params.user_results !== 'undefined')){
         info.hasTable = false;
     } else {
         info.hasTable = true;
     }

     addCoreRenderers(info, 'analyze', datatype);

     //Add pup_tent libs
     info.pup_tent_css_libraries.push("/monarch-main.css");
     info.pup_tent_css_libraries.push("/monarch-specific.css");
     info.pup_tent_css_libraries.push("/imagehover.css");
     info.pup_tent_css_libraries.push("/phenogrid.css");

     info.pup_tent_js_libraries.push("/Analyze.js");
     addPhenogridFiles(info);
     info.pup_tent_js_libraries.push("/stupidtable.min.js");
     info.pup_tent_js_libraries.push("/tables.js");

     info.monarch_launchable = [];
     info.monarch_launchable.push.apply(info.monarch_launchable,
             [
                 'AnalyzeInit()'
             ]);

     info.title = 'Monarch Analysis';

     info.results = info.results.filter( function(a) { return a.combinedScore > 0 } );
     info.resultsTable = function() {
         return genTableOfAnalysisSearchResults(info.results, info.singleSpecies);
     };
     
     if ((mode == 'compare') || (mode == 'search') 
             || (typeof request.params.user_results !== 'undefined')){
         info.hasResults = true;
     } else {
         info.hasResults = false;
     }

     info.downloadURL = function() {
         var inputFix = info.input_items.trim();
         var str = "/analyze/" + datatype + ".json?input_items=" + inputFix.split(" ").join("+");
         if (str.indexOf(',')){
             str = str.replace(/,/g ,'+');
         }
         str += "&limit=" + info.limit + "&target_species="
         if (info.target_species !== null) {
             str += info.target_species;
         }
         return str;
     }

     if (datatype ==='phenotypes') {
         info.isPhenotype='True';
     }

     var output = pup_tent.render('analyze.mustache',info,'monarch_base.mustache');
     return response.html(output);
 });
 

 app.get('/labs/classenrichment', function(request) {
     var info = {};
     addCoreRenderers(info);
     info.pup_tent_css_libraries.push("http://cdn.datatables.net/1.10.6/css/jquery.dataTables.css");
     info.pup_tent_js_libraries.push("http://cdn.datatables.net/1.10.6/js/jquery.dataTables.js");
     info.pup_tent_js_libraries.push("/class-enrichment.js");
     var output = pup_tent.render('class-enrichment-demo.mustache',info,'monarch_base.mustache');
     return response.html(output);
 });

 /**
  * Mostly copied from parseFileUpload from ringo/http
  * See note above in upload function, we update this to implement a limit when
  * streaming user uploaded data into temp files
  * 
  * 
  * Parses a multipart MIME input stream.
  * Parses a multipart MIME input stream.
  * @param {Object} request the JSGI request object
  * @param {Object} params the parameter object to parse into. If not defined
  *        a new object is created and returned.
  * @param {string} encoding optional encoding to apply to non-file parameters.
  *        Defaults to "UTF-8".
  * @param {function} streamFactory factory function to create streams for mime parts
  * @param {int} limit streaming to number of bytes
  * @returns {Object} the parsed parameter object
  */
 function parseFileUploadWithLimit (request, params, encoding, streamFactory, lim) {
     
     // used for multipart parsing
     var HYPHEN  = "-".charCodeAt(0);
     var CR = "\r".charCodeAt(0);
     var CRLF = new ByteString("\r\n", "ASCII");
     var EMPTY_LINE = new ByteString("\r\n\r\n", "ASCII");

     params = params || {};
     encoding = encoding || "UTF-8";
     streamFactory = streamFactory || BufferFactory;
     var boundary = getMimeParameter(request.headers["content-type"], "boundary");
     if (!boundary) {
         return params;
     }
     boundary = new ByteArray("--" + boundary, "ASCII");
     var input = request.input;
     var buflen = 8192;
     var refillThreshold = 1024; // minimum fill to start parsing
     var buffer = new ByteArray(buflen); // input buffer
     var data;  // data object for current mime part properties
     var stream; // stream to write current mime part to
     var eof = false;
     // the central variables for managing the buffer:
     // current position and end of read bytes
     var position = 0, limit = 0;
     var bytesStreamed = 0;

     var refill = function(waitForMore) {
         if (position > 0) {
             // "compact" buffer
             if (position < limit) {
                 buffer.copy(position, limit, buffer, 0);
                 limit -= position;
                 position = 0;
             } else {
                 position = limit = 0;
             }
         }
         // read into buffer starting at limit
         var totalRead = 0;
         do {
             var read = input.readInto(buffer, limit, buffer.length);
             if (read > -1) {
                 totalRead += read;
                 limit += read;
             } else {
                 eof = true;
             }
         } while (waitForMore && !eof && limit < buffer.length);
         return totalRead;
     };

     refill();

     while (position < limit) {
         if (!data) {
             // refill buffer if we don't have enough fresh bytes
             if (!eof && limit - position < refillThreshold) {
                 refill(true);
             }
             var boundaryPos = buffer.indexOf(boundary, position, limit);
             if (boundaryPos < 0) {
                 throw new Error("boundary not found in multipart stream");
             }
             // move position past boundary to beginning of multipart headers
             position = boundaryPos + boundary.length + CRLF.length;
             if (buffer[position - 2] == HYPHEN && buffer[position - 1] == HYPHEN) {
                 // reached final boundary
                 break;
             }
             var b = buffer.indexOf(EMPTY_LINE, position, limit);
             if (b < 0) {
                 throw new Error("could not parse headers");
             }
             data = {};
             var headers = [];
             buffer.slice(position, b).split(CRLF).forEach(function(line) {
                 line = line.decodeToString(encoding);
                 // unfold multiline headers
                 if ((strings.startsWith(line, " ") || strings.startsWith(line, "\t")) && headers.length) {
                     arrays.peek(headers) += line;
                 } else {
                     headers.push(line);
                 }
             });
             for each (var header in headers) {
                 if (strings.startsWith(header.toLowerCase(), "content-disposition:")) {
                     data.name = getMimeParameter(header, "name");
                     data.filename = getMimeParameter(header, "filename");
                 } else if (strings.startsWith(header.toLowerCase(), "content-type:")) {
                     data.contentType = header.substring(13).trim();
                 }
             }
             // move position after the empty line that separates headers from body
             position = b + EMPTY_LINE.length;
             // create stream for mime part
             stream = streamFactory(data, encoding);
         }
         boundaryPos = buffer.indexOf(boundary, position, limit);
         if (boundaryPos < 0) {
             // no terminating boundary found, slurp bytes and check for
             // partial boundary at buffer end which we know starts with "\r\n--"
             // but we just check for \r to keep it simple.
             var cr = buffer.indexOf(CR, Math.max(position, limit - boundary.length - 2), limit);
             var end =  (cr < 0) ? limit : cr;
             if (typeof lim != 'undefined' && bytesStreamed > lim){
                 params.hit_limit = true;
                 stream.close();
                 if (typeof data.value === "string") {
                     mergeParameter(params, data.name, data.value);
                 } else {
                     mergeParameter(params, data.name, data);
                 }
                 data = stream = null;
                 return params; 
             } else {
                 stream.write(buffer, position, end);
                 bytesStreamed += end;
                 // stream.flush();
                 position = end;
             }
             if (!eof) {
                 refill();
             }
         } else {
             if (typeof lim != 'undefined' && bytesStreamed > lim){
                 params.hit_limit = true;
                 stream.close();
                 if (typeof data.value === "string") {
                     mergeParameter(params, data.name, data.value);
                 } else {
                     mergeParameter(params, data.name, data);
                 }
                 data = stream = null;
                 return params;
             }
             // found terminating boundary, complete data and merge into parameters
             stream.write(buffer, position, boundaryPos - 2);
             stream.close();
             position = boundaryPos;
             if (typeof data.value === "string") {
                 mergeParameter(params, data.name, data.value);
             } else {
                 mergeParameter(params, data.name, data);
             }
             data = stream = null;
         }
     }
     return params;
 }

