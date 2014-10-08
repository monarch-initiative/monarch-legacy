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

var pup_tent = require('pup-tent')(['js','css','templates','templates/labs',
                                    'templates/page',
                                    'widgets/datagraph/js',
                                    'widgets/datagraph/css',
                    'widgets/phenogrid/js',
                                    'widgets/phenogrid/css',
                                    'widgets/keggerator/js']);

var app = exports.app = new stick.Application();
app.configure('route');
app.configure('params');
app.configure('static');
app.configure(require('./sanitize'));
app.configure(require('./cors-middleware.js'));

//app.static("docs", "index.html", "/docs");

//Configure pup tent common css and js libs
pup_tent.set_common('css_libs', [
    '/bootstrap.min.css',
    '/monarch-common.css',
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
if (!engine.isProduction()) {
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
// Deprecated with Pup tent
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
function addCoreRenderers(info, type, id) {
    info['@context'] = "/conf/monarch-context.json";
    info.alerts = [];
    info.pup_tent_css_libraries = [];
    info.pup_tent_js_libraries = [];
    info.pup_tent_js_variables = [];
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
    info.css = {};
//     info.css.table = "table table-striped table-condensed";
    if (info.relationships != null) {
        var fragmentId = engine.getOntoquestNifId(id);
        var superClasses = [];
        var subClasses = [];
        var equivalentClasses = [];
        for (var k in info.relationships) {
            var rel = info.relationships[k];
            var propId = rel.property.id;
            if (propId == 'equivalentClass') {
                if (fragmentId == rel.subject.id) {
                    equivalentClasses.push(rel.object);
                }
                else if (fragmentId == rel.object.id) {
                    equivalentClasses.push(rel.subject);
                }
                else {
                    console.error("Logic error: "+rel);
                }
            }
        }
        // The concept of node is taken from the OWLAPI; a node
        // is a set of classes that are mutually equivalent
        var node = equivalentClasses.map(function(c){return c.id}).concat(fragmentId);

        for (var k in info.relationships) {
            var rel = info.relationships[k];
            var propId = rel.property.id;
            if (propId == 'subClassOf' || propId == 'BFO_0000050') {
                if (node.indexOf( rel.subject.id ) > -1) {
                    superClasses.push(rel.object);
                }
                else if (node.indexOf( rel.object.id ) > -1) {
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
        info.alerts.push("This is the beta interface. <a href='"+prodUrl+"'>View this page on the main portal</a>.");
    }
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

// Method: /
//
// Arguments:
//  - none
//
// Returns:
//  Top level page
app.get('/', function(request) {
    var info = {};
    addCoreRenderers(info);

    info.pup_tent_css_libraries =
        [
          '/monarch-main.css',
          '/main.css'
        ];
    info.title = 'Monarch Diseases and Phenotypes';
    var output = pup_tent.render('main.mustache',info,'monarch_base.mustache');
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
    return (".", path, ct);
    //return ('docs','files/js-api.html','text/html');
});
/*
 * This seems to be broken with the puptent update
 * Error:
 * TypeError: Cannot set property "Access-Control-Allow-Origin" of undefined to "*"
 *    at /home/kshefchek/git/monarch-app/lib/monarch/web/cors-middleware.js:26 (accessControl)
 *    at stick/lib/stick.js:37 (app)
 *    at ringo/jsgi/connector.js:42 (handleRequest)
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

/*
 * DEPRECATED with PUPTENT
 *
 *
 // Keggerator: pass-thru
 // this is required to allow the .moustache templates to access the .js
 app.get('/widgets/keggerator/js/:page', function(request,page) {
     return ('widgets/keggerator/js',page,'text/html');
 });

 // Datagraph: pass-thru
 // this is required to allow the .moustache templates to access the .js
 app.get('/widgets/datagraph/js/:page', function(request,page) {
     return ('widgets/datagraph/js',page,'text/javascript');
 });
 app.get('/widgets/datagraph/css/:page', function(request,page) {
     return ('widgets/datagraph/css',page,'text/css');
 });*/

// Method: search
//
// searches over ontology terms via OntoQuest
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
            engine.log("Redirecting" + term);
            return response.redirect(genURL('object',term));
        }

        // temporary fix: need to properly figure out when to encode/decode
        // See: https://github.com/monarch-initiative/monarch-app/issues/287
        term = term.replace(/&#039;/g, "'");
        var results = engine.searchOverOntologies(term);
        var info =
            {
                results: results
            };
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
        info.resultsTable = function() {return genTableOfSearchResults(info.results); };
        info.genResultsTable = function() {return genTableOfSearchDataResults(info.otherResults) };


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

//list all of the sources supplying data to monarch.
app.get('/sources.:fmt?', function(request, fmt) {
try {
        //fetch data description json
        var sources = engine.fetchDataDescriptions();
        var info = {};
        // adorn object with rendering functions
        info.sourcesTable = function() {return genTableOfDataSources(sources); };
        addCoreRenderers(info, 'sources');

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
    var info = engine.searchSubstring(term, {category : category});
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
    info.spotlight.link = genObjectHref('disease',{id:info.spotlight.id, label:"Explore"});

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
    
    //graph
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    var disPhenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-disease-phenotype-distro.json'));
    info.disPhenoGraph = function() {return genDiseasePhenoGraph(disPhenoDist.dataGraph)};

        var output = pup_tent.render('disease_main.mustache', info);
        var res =  response.html(output);
        return res;
});


// DISEASE PAGE
// Status: working but needs work
app.get('/disease/:id.:fmt?', function(request, id, fmt) {
    try {
        engine.log("getting /disease/:id where id="+id);
        var newId = engine.resolveClassId(id);
        if (newId != id) {
            engine.log("redirecting: "+id+" ==> "+newId);
            return response.redirect(genURL('disease',newId));
        }
        engine.log("Fetching id from engine, where cache="+engine.cache);
        var info = engine.fetchDiseaseInfo(id);
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

        info.pup_tent_js_libraries.push("/keggerator.js");
	info.pup_tent_js_libraries.push("/phenogrid_config.js");
        info.pup_tent_js_libraries.push("/phenogrid.js");
        info.pup_tent_js_libraries.push("/diseasepage.js");
        info.pup_tent_js_libraries.push("/stupidtable.min.js");
        info.pup_tent_js_libraries.push("/tables.js");

        info.title = 'Monarch Disease: '+info.label+' ('+ info.id+')';

        //HACK because we are always redirected to the underscore, we need curi-style ids for proper link generation
        //ONTOQUEST!!!
        info.primary_xref = function() {return genExternalHref('source',{id : id.replace(/_/,':')})};

        info.hasHeritability = function() {return checkExistence(info.heritability)};
    info.heritability = engine.unique(info.heritability.map(function(h) {return h.inheritance.label})).join(", "); 
    
        info.aka = function() {
            if (info.has_exact_synonym != null && info.has_exact_synonym.length > 0) {
                var result = info.has_exact_synonym[0];
                for (var i = 1; i < info.has_exact_synonym.length; i++) {
                    result += ", " + info.has_exact_synonym[i];
                }
                return result;
            }
        };
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
        info.hasDef = function() {return checkExistence(info.definition)};
        info.hasComment = function() {return checkExistence(info.comment)};
        info.hasAka = function() {return checkExistence(info.has_exact_synonym)};
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

        var output = pup_tent.render('disease.mustache',info,'monarch_base.mustache');
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
app.get('/disease/:id/:section.:fmt?', function(request, id, section, fmt) {
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
    
    //graph
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    
    var phenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-phenotype-annotation-distro.json'));
    info.phenoGraph = function() {return genPhenoGraph(phenoDist.dataGraph)};
    
    var output = pup_tent.render('phenotype_main.mustache', info);
    var res =  response.html(output);
    return res;
});

app.get('/phenotype/:id.:fmt?', function(request, id, fmt) {

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

        info.aka = function() {
            if (info.has_exact_synonym != null && info.has_exact_synonym.length > 0) {
                var result = info.has_exact_synonym[0];
                for (var num = 1; num < info.has_exact_synonym.length; num++) {
                    result += ", " + info.has_exact_synonym[num];
                }
                return result;
            }
        };
        info.xrefs = function() {
            if (info.database_cross_reference != null) {
            return info.database_cross_reference.map(function(r) { return genExternalHref('source',{id : r}) }).join(", ");
            //return info.database_cross_reference.join(", ");
            }
        };

        // variables checking existence of data in sections
        info.hasDef = function() {return checkExistence(info.definition)};
        info.hasAka = function() {return checkExistence(info.has_exact_synonym)};
        info.hasXrefs = function() {return checkExistence(info.database_cross_reference)};
        info.hasDiseases = function() {return checkExistence(info.disease_associations)};
        info.hasGenes = function() {return checkExistence(info.gene_associations)};
        info.hasGenotypes = function() {return checkExistence(info.genotype_associations)};
        info.hasLiterature = function() {return checkExistence(info.literature)};

        info.diseaseNum = function() {return getNumLabel(info.disease_associations)};
        info.geneNum = function() {return getNumLabel(info.gene_associations)};
        info.genotypeNum = function() {return getNumLabel(info.genotype_associations)};
        info.literatureNum = function() {return getNumLabel(info.pmidinfo)};

        // adorn object with rendering functions
        info.diseaseTable = function() {return genTableOfDiseasePhenotypeAssociations(info.disease_associations)} ;
        info.geneTable = function() {return genTableOfGenePhenotypeAssociations(info.gene_associations)};
        info.genotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.genotype_associations)};
        info.literatureTable = function() {return genTableOfLiterature(info.literature, info.pmidinfo)};

        var output = pup_tent.render('phenotype.mustache',info,'monarch_base.mustache');
        return response.html(output);
        //return response.html(Mustache.to_html(getTemplate('phenotype'), info));
    }
    catch(err) {
        return errorResponse(err);
    }
});

// PHENOTYPE - Sub-pages
// Example: /phenotype/MP_0000854/phenotype_associations.json
// Currently only works for json or rdf output
app.get('/phenotype/:id/:section.:fmt?', function(request, id, section, fmt) {
    var newId = engine.resolveClassId(id);
    if (newId != id) {
        engine.log("redirecting: "+id+" ==> "+newId);
        return response.redirect(genURL('phenotype',newId));
    }

    var info = engine.fetchPhenotypeInfo(id);

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

// Status: super-prototypey, this is a good project for the geno modelers
/*app.get('/genotype/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchGenotypeInfo(id);
    if (fmt != null) {
        return formattedResults(info,fmt,request);
    }

    addCoreRenderers(info, 'genotype', id);

    // adorn object with rendering functions
    info.phenotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.phenotype_associations)} ;

    return response.html(Mustache.to_html(getTemplate('genotype'), info));
});
*/

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

	info.pup_tent_js_libraries.push("/phenogrid_config.js");
        info.pup_tent_js_libraries.push("/phenogrid.js");
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

        info.primary_xref = function() {return genExternalHref('source',{id : id})};
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

        var output = pup_tent.render('genotype.mustache',info,'monarch_base.mustache');
        return response.html(output);
        //return response.html(Mustache.to_html(getTemplate('genotype'), info));
    }
    catch(err) {
        return errorResponse(err);
    }
};


app.get('/genotype/:id.:fmt?',fetchGenotypePage);


// GENOTYPE - Sub-pages
// Example: /genotype/MGI_4420313/genotype_associations.json
// Currently only works for json or rdf output
app.get('/genotype/:id/:section.:fmt?', function(request, id, section, fmt) {
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
});


app.get('/gene', function(request) {
    var info = prepLandingPage();
    info.blog_results = loadBlogData('gene-news', 4);
    info.spotlight = engine.fetchSpotlight('gene');
    info.spotlight.link = genObjectHref('gene',{id:info.spotlight.id, label:"Explore"});

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
    
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    
    var diseaseDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-disease-gene-distro.json'));
    info.disGraph = function() {return genDiseaseGraph(diseaseDist.dataGraph)};

    var output = pup_tent.render('gene_main.mustache', info);
    var res =  response.html(output);
    return res;
});

// Status: STUB
app.get('/gene/:id.:fmt?', function(request, id, fmt) {

    //Redirect to NCBI Gene ID
    var mappedID;
    if (!id.match(/^NCBI[Gg]ene/)){
        var mappings = engine.mapGeneToNCBIgene(id);
        var ncbigene_ids = Object.keys(mappings);
        if (ncbigene_ids.length > 0) {
            mappedID = mappings[ncbigene_ids[0]];
        }
    }
    if (mappedID){
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

    info.pup_tent_js_libraries.push("/stupidtable.min.js");
    info.pup_tent_js_libraries.push("/tables.js");


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

    var output = pup_tent.render('gene.mustache',info,'monarch_base.mustache');
    return response.html(output);
    //return response.html(Mustache.to_html(getTemplate('gene'), info));
});

app.get('/model', function(request) {
    var info = prepLandingPage();
    info.blog_results = loadBlogData('model-news', 4);
    
    //graph
    info.pup_tent_css_libraries.push("/datagraph.css");
    info.pup_tent_js_libraries.push("/datagraph.js");
    var phenoGenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-pheno-genotype-distro.json'));
    info.phenoGenoGraph = function() {return genPhenoGenoGraph(phenoGenoDist.dataGraph)};
    
    var output = pup_tent.render('model_main.mustache', info);
    var res =  response.html(output);
    return res;
});

// Status: STUB
// this just calls the genotype page - TODO
app.get('/model/:id.:fmt?', fetchGenotypePage);

/*
app.get('/model/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchModelInfo(id);
    if (fmt != null) {
    return formattedResuts(info,fmt,request);
    }

    // adorn object with rendering functions
    //info.diseaseTable = function() {return genTableOfDiseaseGeneAssociations(info.disease_associations)} ;
    //info.phenotypeTable = function() {return genTableOGenePhenotypeAssociations(info.phenotype_associations)} ;
    //info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;

    return response.html(Mustache.to_html(getTemplate('model'), info));
});
*/

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
// be a list of gene(s), disease(s), and/or genotype(s).  Target identifiers should be delimited with a plus "+"
// sign
//
// For details on owlsim, see http://owlsim.org
//
// Paths:
//  - /compare/  (HTML only) -- coming soon!
//  - /compare/:id1/:id2  (JSON only)
//  - /compare/:id1/:id2+id3+...idN (JSON only)
//
// Formats:
//  - json
//
//  Examples:
//  - /compare/OMIM_143100/MGI:3664660.json
//  - /compare/OMIM:270400/NCBIGene:18595+OMIM:249000+OMIM:194050.json
//
// Returns:
//  A pairwise-comparison of phenotypes belonging to the query to the target(s), together with the LCS, and their scores.
//  The data follows the same format as is used for search.  The query (including it's identifier, label, type, and
//  phenotype ids will be listed in the "a" object; the target(s) in the "b" array object.  If only one b is supplied,
//  only one element will be found in "b".
//  The resulting "combinedScore" is generated based on a perfect match of the query to itself.  Therefore, the reciprocal
//  combined score may not be the same.  QxT !== TxQ.
app.get('/compare/:x/:y.:fmt?', function(request, x, y, fmt) {
//    var info = engine.fetchAttributeComparisonMatrix(x,y);
    var ys = y.split("+");
    var info = engine.compareEntities(x,y);

    return response.json(info);
});


// Redirects
app.get('/reference/:id.:fmt?', function(request, id, fmt) {
    //var info = engine.fetchReferenceInfo(id);  TODO
    return response.redirect(engine.expandIdToURL(id));
});

// STUB
app.get('/publication/basic/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchReferenceInfo(id);  //TODO
});


app.get('/variant/:id.:fmt?', function(request, id, fmt) {
    //since we don't have allele or variant pages,
    //we will redirect to the sources for now
    var newId = engine.resolveClassId(id);
    if (newId != id) {
        var url;
        if (id.match(/^OMIM/)){
            url = makeExternalURL(id+"."+fmt);
        } else {
            url = makeExternalURL(id);
        }
        engine.log("redirecting: "+id+" to source at "+url);
        return response.redirect(url);
    }
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

app.get('/simsearch/phenotype.:fmt?', function(request, fmt) {
    var target = null;
    var info = {results:[]};
    var target_species = request.params.target_species; //|| '9606'; //default to human
    var target_type = request.params.target_type; //|| 'disease';
    var limit = request.params.cutoff || request.params.limit || 100;
    var input_items = getIdentifierList(request.params);
    //input_items = engine.mapIdentifiersToPhenotypes( input_items );
    info.results = engine.searchByPhenotypeProfile(input_items,target_species,null,limit);

    return response.json(info.results);

});

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


app.get('/analyze/:datatype.:fmt?', function(request, datatype, fmt) {
    var target = request.params.target;
    var species = request.params.target_species;

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

    if (species == "" || species == "All") {
        species = null;
    }
    else {
        tf.species = species;
    }

    engine.log("analzye...datatype is ..."+datatype);
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
    input_items = engine.mapIdentifiersToPhenotypes( input_items );
    engine.log("input items...."+JSON.stringify(input_items));
    engine.log("# of input items..."+input_items.length);
        limit = request.params.limit;

        resultObj = engine.searchByAttributeSet(input_items, tf, limit);
        info.results = resultObj.results;
        engine.log("ResultsInput: "+info.results.length);

        //info.input_items = resultObj.query_IRIs;
        info.input_items = input_items.join(" ");
        info.hasInputItems = true;

    info.target_species=species;
    }
    else {
        info.hasInputItems = false;
    }
    if (fmt != null) {
    return formattedResults(info,fmt,request);
    }
    info.limit = limit;

    info.singleSpecies = true;
    if (info.target_species === null || info.target_species == "") {
        info.singleSpecies = false;
    }

    if (info.singleSpecies) {
        info.speciesHref = genExternalHref('source', engine.mapSpeciesIdentifierToTaxon(info.target_species))
    }

    addCoreRenderers(info, 'analyze', datatype);

    //Add pup_tent libs
    info.pup_tent_css_libraries.push("/monarch-main.css");
    info.pup_tent_css_libraries.push("/monarch-specific.css");
    info.pup_tent_css_libraries.push("/imagehover.css");
    info.pup_tent_css_libraries.push("/phenogrid.css");

    info.pup_tent_js_libraries.push("/Analyze.js");
    info.pup_tent_js_libraries.push("/phenogrid.js");
    info.pup_tent_js_libraries.push("/stupidtable.min.js");
    info.pup_tent_js_libraries.push("/tables.js");

    info.title = 'Monarch Analysis';

    info.results = info.results.filter( function(a) { return a.combinedScore > 0 } );
    info.hasResults = (info.results.length > 0);
    info.resultsTable = function() {return genTableOfAnalysisSearchResults(info.results, info.singleSpecies);} ;

    info.downloadURL = function() {
        var str = "/analyze/" + datatype + ".json?input_items=" + info.input_items.split(" ").join("+");
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
    //return response.html(Mustache.to_html(getTemplate('analyze'), info));
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
        var output = pup_tent.render('labs.mustache',info,'monarch_base.mustache');
        return response.html(output);
    });

//A routing page different non-production demonstrations and tests.
app.get('/labs/datagraph.:fmt?',function(request,fmt){
    
        var info = {};
        if (1!=1){
            var diseaseDist = engine.getDiseaseGeneDistro("DOID:7",6,true);
            var phenoDist = engine.getPhenotypeDistro("HP:0000118",6,true);
            var disPhenoDist = engine.getCacheFile('stats','disease-phenotype-distro');
            var phenoGenoDist = engine.getPhenotypeGenotypeDistro('HP:0000118',3,true);
        }
        
        var diseaseDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-disease-gene-distro.json'));
        var phenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-phenotype-annotation-distro.json'));
        var disPhenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-disease-phenotype-distro.json'));
        var phenoGenoDist = JSON.parse(fs.read('./widgets/datagraph/stats/key-pheno-genotype-distro.json'));


        if (fmt != null) {
            return formattedResults(info,fmt,request);
        }

        addCoreRenderers(info);
        info.pup_tent_js_libraries.push("/datagraph.js");
        info.pup_tent_css_libraries.push("/datagraph.css");
        info.pup_tent_css_libraries.push("/monarch-labs.css");
        info.pup_tent_css_libraries.push("/monarch-specific.css");
        info.pup_tent_css_libraries.push("/monarch-main.css");
        info.pup_tent_css_libraries.push("/main.css");
        info.title = 'Monarch Diseases and Phenotypes';

        info.phenoGraph = function() {return genPhenoGraph(phenoDist.dataGraph)};
        info.disGraph = function() {return genDiseaseGraph(diseaseDist.dataGraph)};
        info.disPhenoGraph = function() {return genDiseasePhenoGraph(disPhenoDist.dataGraph)};
        info.phenoGenoGraph = function() {return genPhenoGenoGraph(phenoGenoDist.dataGraph)};

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
            var labelA=a.label.toLowerCase(), labelB=b.label.toLowerCase()
            if (labelA < labelB) //sort string ascending
              return -1
            if (labelA > labelB)
              return 1
            return 0 //default return value (no sorting)
              })
  return array;

}


app.get('/labs/blog-scratch',
    function(request, page){

        // Rendering.
        var info = {};
        addCoreRenderers(info);

        // Data for data ticker.
        var ticker_cache = engine.fetchDataDescriptions();
        // var ticker_cache = [
        //     'Cras justo odio 1',
        //     'Dapibus ac facilisis in 1',
        //     'Morbi leo risus 1',
        //     'Porta ac consectetur ac 1',
        //     'Vestibulum at eros 1',
        //     'Cras justo odio 2',
        //     'Dapibus ac facilisis in 2',
        //     'Morbi leo risus 2',
        //     'Porta ac consectetur ac 2',
        //     'Vestibulum at eros 2'
        // ];
        info.ticker_results = ticker_cache;

        // Now add the stuff that we need to move forward.
        //info.pup_tent_css_libraries.push("/bootstrap-glyphicons.css");
        info.pup_tent_css_libraries.push("/monarch-labs.css");
        info.pup_tent_js_libraries.push("/BlogScratch.js");
        info.pup_tent_js_variables.push({'name': 'global_data_ticker',
                         'value': ticker_cache});

        // Get blog data and render with vars.
        var blog_res = _get_blog_data();
        // Limit to X.
        var lim = 4;
        if( blog_res && blog_res.length > lim ){
        blog_res = blog_res.slice(0, lim);
        }
        info.blog_results = blog_res;
        info.title = 'Welcome to Monarch';
        var output = pup_tent.render('blog-scratch-landing.mustache', info,
                     'blog-scratch-base.mustache');
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
    
