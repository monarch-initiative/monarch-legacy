 /*

   Monarch WebApp

  See the RingoJS and Stick documentation for details on the approach.

  After some helper functions are declared, this consists of mappings of URL patterns to queries + visualization

 */

var stick = require('stick');
var Mustache = require('ringo/mustache');
var fs = require('fs');
var response = require('ringo/jsgi/response');

var httpclient = require('ringo/httpclient');
var http = require('ringo/utils/http');

var app = exports.app = new stick.Application();
app.configure('route');
app.configure('params');
app.configure('static');
app.configure(require('./sanitize'));
app.configure(require('./cors-middleware.js'));

//app.static("docs", "index.html", "/docs");

// note: in future this may conform to CommonJS and be 'require'd
var engine = new bbop.monarch.Engine();

// note: this will probably move to it's own OO module
engine.cache = {
    fetch: function(tbl, key, val) {
        var path = "./cache/"+tbl+"/key-"+key+".json";
        console.log("R lookup:"+path);
        if (fs.exists(path)) {
            console.log("Using cached for:"+key);
            return JSON.parse(fs.read(path));
        }
        return null;
    },
    store: function(tbl, key, val) {
        var path = "./cache/"+tbl+"/key-"+key+".json";
        console.log("S lookup:"+path);
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
    return response.html(Mustache.to_html(getTemplate(t), info));
}

function serveDirect(loc,page,ctype) {
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
    info.scripts = [
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
    ];
    if (id != null) {
        info.base_url = "/"+type+"/"+id;
        info.download = {
            "json" : genURL(type, id, 'json')
        };
        console.log("DN:"+JSON.stringify(info.download));
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
                    console.warn("Logic error: "+rel);
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
                    console.warn("Logic error: "+rel);
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
    console.log("Throwing error:" + msg);
    for (var k in msg) {
        console.log("  :"+k+"="+msg[k]);
    }
    var stm = require("ringo/logging").getScriptStack(msg);
    console.log("Stack trace="+stm);
    //info.message = JSON.stringify(msg, null, ' ');
    info.stackTrace = stm;
    info.message = msg.message;
    var res = response.html(Mustache.to_html(getTemplate('error'),info));
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
    return response.html(Mustache.to_html(getTemplate('main'), info));
});

// generic template
app.get('/page/:page', function(request,page) {
    var info = {};
    addCoreRenderers(info);
    return response.html(Mustache.to_html(getTemplate('page/'+page), info));
});

// block unwanted access
app.get('/robots.txt', function(request,page) {
    var info = {};
    addCoreRenderers(info);
    return {
        status: 200,
        headers: {"Content-Type": 'text/plain'},
        body: [Mustache.to_html(getTemplate('page/robots'), info)]
    };
});

// anything in the docs/ directory is passed through statically
app.get('/docs/*', function(request) {
    var path = request.pathInfo;
    console.log(path);
    var ct = 'text/plain';
    if (path.indexOf(".html") > 0) {
        ct = "text/html";
    }
    if (path.indexOf(".css") > 0) {
        ct = "text/css";
    }
    return serveDirect(".", path, ct);
    //return serveDirect('docs','files/js-api.html','text/html');
});

// CSS: pass-thru
app.get('/css/:page', function(request,page) {
    return serveDirect('css',page,'text/css');
});
// JS: pass-thru
app.get('/js/:page', function(request,page) {
   return serveDirect('js',page,'text/plain');
});
// IMG: pass-thru
app.get('/image/:page', function(request,page) {
    var s = fs.read('./image/'+page, {binary:true});
    return {
      body: [s],
      headers: {'Content-Type': 'image/png'},
      status: 200
   };
});


// Modeltype: pass-thru 
// this is required to allow the .moustache templates to access the .js and images
app.get('/widgets/modeltype/js/:page', function(request,page) {
    return serveDirect('widgets/modeltype/js',page,'text/html');
});

app.get('/widgets/modeltype/js/:page', function(request,page) {
    return serveDirect('widgets/modeltype/js',page,'text/plain');
});

//Modeltype IMG: pass-thru
app.get('/widgets/modeltype/image/:page', function(request,page) {
     var path = request.pathInfo;
     console.log(path);
     var ct = 'image/png';
     if (path.indexOf(".gif") > 0) {
         ct = "image/gif";
     }
     var s = fs.read('widgets/modeltype/image/'+page, {binary:true});
     return {
       body: [s],
       headers: {'Content-Type': [ct]},
       status: 200
    };
    // return serverDirect('widgets/modeltype/image',page, ct);
});


 // Keggerator: pass-thru
 // this is required to allow the .moustache templates to access the .js
 app.get('/widgets/keggerator/js/:page', function(request,page) {
     return serveDirect('widgets/keggerator/js',page,'text/html');
 });

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
            console.log("Redirecting" + term);
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
        if (fmt != null) {
            return formattedResults(info, fmt);
        }
        
        info.term=term;
        // HTML
        addCoreRenderers(info, 'search', term);
        
        // adorn object with rendering functions
        info.resultsTable = function() {return genTableOfSearchResults(info.results); };
        
        return response.html(Mustache.to_html(getTemplate('search_results'), info));    
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
    console.log("trying to contemplate on .."+term+" in "+category);
    var info = engine.searchSubstring(term, {category : category});
    // todo - DRY - reuse code from below
    console.log("got autocomplete results..."+info.length);
    if (info.length > 0) { console.log("first is: "+info[0].term); }
    if (fmt != null) {
        console.log("format is "+fmt);
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
    console.log("trying to contemplate on .."+term);
    var info = engine.searchSubstring(term);
    console.log("got autocomplete results..."+info.length);
    if (info.length > 0) { console.log("first is: "+info[0].term); }
    if (fmt != null) {
    console.log("format is "+fmt);
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
    return staticTemplate('disease_main');
});



// DISEASE PAGE
// Status: working but needs work
app.get('/disease/:id.:fmt?', function(request, id, fmt) {
    try {
        console.log("getting /disease/:id where id="+id);
        var newId = engine.resolveClassId(id);
        if (newId != id) {
            console.log("redirecting: "+id+" ==> "+newId);
            return response.redirect(genURL('disease',newId));
        }
        console.log("Fetching id from engine, where cache="+engine.cache);
        var info = engine.fetchDiseaseInfo(id); 
        console.log("Got info for disease");
        if (fmt != null) {
            return formattedResults(info, fmt,request);
        }
        
        // HTML
        addCoreRenderers(info, 'disease', id);
		//HACK because we are always redirected to the underscore, we need curi-style ids for proper link generation
		//ONTOQUEST!!!
        info.primary_xref = function() {return genExternalHref('source',{id : id.replace(/_/,':')})};
 
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
        //console.log("ALLELE TABLE-pre mustache:"+JSON.stringify(info));
        info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models);};
        //TODO: figure out how to best show this... one table per species?
        //TODO: defaulting to showing mouse here - since it's the only one we have
        info.simModelTable = function () {return genTableOfSimilarModels(info.similar_models['10090']);};
        info.simTable = function() {return genTableOfSimilarDiseases(info.similar_diseases);};
        info.pathwayTable = function() {return genTableOfDiseasePathwayAssociations(info.pathway_associations);};
        info.literatureTable = function() {return genTableOfLiterature(info.literature, info.pmidinfo);};
        
        var r = response.html(Mustache.to_html(getTemplate('disease'), info));
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
        console.log("redirecting: "+id+" ==> "+newId);
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
    return staticTemplate('phenotype_main');
});

app.get('/phenotype/:id.:fmt?', function(request, id, fmt) {

    // TEMPORARY. Remove when this resolved: https://github.com/monarch-initiative/monarch-app/issues/246
    if (id.indexOf("ZP") == 0) {

        var info = {
            message: "Zebrafish phenotypes are currently under construction"
        };
        addCoreRenderers(info);
        var res = response.html(Mustache.to_html(getTemplate('underconstruction'),info));
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

        return response.html(Mustache.to_html(getTemplate('phenotype'), info));
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
        console.log("redirecting: "+id+" ==> "+newId);
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
        
        addCoreRenderers(info, 'genotype', id);

        // variables checking existence of data in sections
        info.hasPhenotypes = function() {return checkExistence(info.phenotype_associations)};
        info.hasDiseases = function() {return checkExistence(info.disease_associations)};
        info.hasGenes = function() {return checkExistence(info.gene_associations)};
        info.hasSim = function() {return checkExistence(info.sim)};
        info.hasLiterature = function() {return checkExistence(info.literature)};
        
        //info.phenotypeNum = function() {return getNumLabel(info.phenotype_associations)};
        info.phenotypeNum = function() {
            if (info.phenotype_associations != null) {
                return getNumLabel(engine.unique(info.phenotype_associations.map(
                    function(p) {if (p.phenotype !== null && typeof p.phenotype !== 'undefined') {
                        return p.phenotype.id;
                    }})))};
            return 0;
        };

        info.diseaseNum = function() {return getNumLabel(info.disease_associations)};
        info.geneNum = function() {return getNumLabel(info.gene_associations)};
        info.simNum = function() {return getNumLabel(info.sim)};
        info.literatureNum = function() {return getNumLabel(info.pmidinfo)};
  
        info.primary_xref = function() {return genExternalHref('source',{id : id})};
        //info.xrefs = function() {return genExternalHref('source',{id : id})};
 
        // adorn object with rendering functions
        info.phenotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.phenotype_associations);} ;
        info.literatureTable = function() {return genTableOfLiterature(info.literature, info.pmidinfo);};

        info.annotationScore = function() {
            if (info.annotation_sufficiency != null) {
                return (5 * info.annotation_sufficiency);
            } else {
                return 0;
            }
        };
        
        return response.html(Mustache.to_html(getTemplate('genotype'), info));
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
        console.log("redirecting: "+id+" ==> "+newId);
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
    return staticTemplate('gene_main');
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
    
    var info = engine.fetchGeneInfo(id);
    if (fmt != null) {
        return formattedResults(info,fmt,request);
    }

    // HTML
    addCoreRenderers(info, 'gene', id);

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
	info.xrefs        = function() {return genExternalHref('source',info.references)};
	info.xrefTable    = function() {return genTableOfGeneXRefs(info.references);};

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

    return response.html(Mustache.to_html(getTemplate('gene'), info));
});

app.get('/model', function(request) {
    return staticTemplate('model_main');
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

// E.g. /compare/OMIM_143100/MGI:3664660.json
app.get('/compare/:x/:y.:fmt?', function(request, x, y, fmt) {
    var info = engine.fetchAttributeComparisonMatrix(x,y); 
    if (fmt != null) {
    return formattedResults(info,fmt,request);
    }
    // TODO - we may not need an HTML version
    //return response.html(Mustache.to_html(getTemplate('comparison'), info));
});

// E.g. /multicompare/OMIM_143100/MGI_3664660+MGI_nnn+MGI_mmmm.json
app.get('/multicompare/:x/:y.:fmt?', function(request, x, y, fmt) {
    var ys = y.split("+");
    var info = engine.fetchAttributeMultiComparisonMatrix(x, ys); 
    if (fmt != null) {
    return formattedResults(info,fmt,request);
    }
    
    // TODO - we may not need an HTML version
    //return response.html(Mustache.to_html(getTemplate('comparison'), info));
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
		console.log("redirecting: "+id+" to source at "+url);
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

    return response.html(Mustache.to_html(getTemplate('anatomy'), info));
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
    info.similarNum = function() { return getNumLabel(info.similarPapers) };
    info.similarPapersTable = function() { return genTableOfSimilarPapers(info.similarPapers) };

    return response.html(Mustache.to_html(getTemplate('literature'), info));
});

function getIdentifierList(params) {
    print(JSON.stringify(params));
    var input_items;
    if (params.a != null) {
        input_items = params.a;
        console.log("Request: "+input_items);
        console.log("Request Type: "+ typeof input_items);
    }
    else {
        input_items = params.input_items.split(/[\s,]+/);
    }
    console.log("|Input| = "+input_items.length);
    console.log("Input: "+input_items);
    return input_items;
}


function mapStyleToCategories(style) {
    console.log("Mapping "+style+" to categories");
    //TODO: use external "style" files to map the style parameter to categories
    //for now, default to HPO categories
    var categories = [];
    categories = ["HP:0000924", "HP:0000707", "HP:0000152", "HP:0001574", "HP:0000478", "HP:0001626", "HP:0001939", "HP:0000119", "HP:0001438", "HP:0003011", "HP:0002664", "HP:0001871", "HP:0002715", "HP:0000818", "HP:0002086", "HP:0000598", "HP:0003549", "HP:0001197", "HP:0001507", "HP:0000769"];
    return categories;
}

app.get('/score', function(request) {
    console.log("Ready to score");
    console.log("Params:"+JSON.stringify(request.params));
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
    console.log("Params:"+JSON.stringify(request.params));
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
            console.log("RES:"+JSON.stringify(r));
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
    info.hasResults = (info.results.length > 0);
    return response.html(Mustache.to_html(getTemplate('annotate'), info));
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
    return response.html(Mustache.to_html(getTemplate('annotate_minimal'), info));
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
        console.warn("Use of target as a parameter is deprecated");
        tf.target = target;
    }

    if (species == "" || species == "All") {
        species = null;
    }
    else {
        tf.species = species;
    }

    console.log("analzye...datatype is ..."+datatype);
    console.log("Target="+target); // deprecated
    console.log("Species="+species);
    console.log("ResultFilter="+JSON.stringify(tf));
    var info = 
        {
            target_filter : tf,
            datatype: datatype, 
            results:[]
        };
    var limit = 100;
    if (request.params.input_items != null) {
    console.log("request params are ..."+JSON.stringify(request.params));
        var input_items = getIdentifierList(request.params);
    input_items = engine.mapIdentifiersToPhenotypes( input_items );
    console.log("input items...."+JSON.stringify(input_items));
    console.log("# of input items..."+input_items.length);
        limit = request.params.limit;

        resultObj = engine.searchByAttributeSet(input_items, tf, limit);
        info.results = resultObj.results;
        console.log("ResultsInput: "+info.results.length);

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

    return response.html(Mustache.to_html(getTemplate('analyze'), info));
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
	    return response.html(Mustache.to_html(getTemplate('labs'), info));
	});

//A routing page different non-production demonstrations and tests.
app.get('/labs/datagraph.:fmt?',function(request,fmt){

        var info = engine.generateHistogram("HP:0000118",3,'true');
	    
	    if (fmt != null) {
	        return formattedResults(info,fmt,request);
	    }
	    
	    addCoreRenderers(info);
	    info.scripts.push({"url" : '/js/datagraph.js'});
        return response.html(Mustache.to_html(getTemplate('labs/datagraph'), info));
    });

// A routing page different non-production demonstrations and tests.
app.get('/labs/cy-path-demo',
	function(request, page){
	    var info = {};
	    addCoreRenderers(info);

	    // Now add the stuff that we need to move forward.
	    info.scripts.push({"url" : '/js/bbop.js'});
	    info.scripts.push({"url" : '/js/amigo_data_context.js'});
	    info.scripts.push({"url" : '/js/cytoscape.js'});
	    info.scripts.push({"url" : '/js/CytoDraw.js'});
	    info.scripts.push({"url" : '/js/CyPathDemo.js'});
	    info.stylesheets.push({"url" : "/css/monarch-labs.css"});

	    return response.html(Mustache.to_html(getTemplate('labs/cy-path-demo'), info));
	});

// A routing page different non-production demonstrations and tests.
app.get('/labs/cy-explore-demo',
	function(request, page){
	    var info = {};
	    addCoreRenderers(info);

	    // Now add the stuff that we need to move forward.
	    info.scripts.push({"url" : '/js/bbop.js'});
	    info.scripts.push({"url" : '/js/amigo_data_context.js'});
	    info.scripts.push({"url" : '/js/cytoscape.js'});
	    info.scripts.push({"url" : '/js/CytoDraw.js'});
	    info.scripts.push({"url" : '/js/CyExploreDemo.js'});
	    info.stylesheets.push({"url" : "/css/monarch-labs.css"});

	    return response.html(Mustache.to_html(getTemplate('labs/cy-explore-demo'), info));
	});

// Playing around with remote resource/feed reading/
function _get_blog_data(){
    // Grab off page.
    var base = 'http://monarch-initiative.blogspot.com';
    var rsrc =	base + '/feeds/posts/default?alt=rss';
    var catr = base + '/search/label/';
    
    var res = [];
    try {
	var http_client = require("ringo/httpclient");
	var exchange = http_client.get(rsrc);
	if( exchange && exchange.content ){
	    var c = exchange.content;
	    //console.log('got: ' + got);
	    
	    // For E4X bug 336551.
	    c = c.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "");
	    var rss = new XML(c);
	    if( rss && rss.channel && rss.channel.item ){
		for each( var item in rss.channel.item ) {
		    //console.log('prop: ' + item.title);

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
	    //console.log('xml: ' + rss);
	}
    } catch (e) {
	//} finally {
	console.log('error: ' + e);
    }
    return res;
}
app.get('/labs/blog-scratch',
	function(request, page){

	    var res = _get_blog_data();

	    // Rendering.
	    var info = {};
	    addCoreRenderers(info);

	    // Now add the stuff that we need to move forward.
	    info.scripts.push({"url" : '/js/bbop.js'});
	    info.scripts.push({"url" : '/js/amigo_data_context.js'});
	    info.stylesheets.push({"url" : "/css/monarch-labs.css"});

	    info.blog_results = res;

	    info.includes.blog_nav = Mustache.to_html(getTemplate('labs/blog-scratch-nav'), {});
	    info.includes.blog_foot = Mustache.to_html(getTemplate('labs/blog-scratch-foot'), {});
	    return response.html(Mustache.to_html(getTemplate('labs/blog-scratch'), info));
	});

// Add an error for all of the rest.
app.get('/*',function(request) {
    var info = {};
    addCoreRenderers(info);
    var res = response.html(Mustache.to_html(getTemplate('notfound'),info));
    res.status = 404;
    return res;
});


// INITIALIZATION
// Can set port from command line. E.g. --port 8080
if (require.main == module) {
   require('ringo/httpserver').main(module.id);
}
