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

var app = exports.app = new stick.Application();
app.configure('route');
app.configure('params');
app.configure('static');

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
    clear: function() {
        var files = fs.listTree("cache");
        for (var i=0; i<files.length; i++) {
            var file = files[i];
            console.log("T:"+file);
            if (file.indexOf("key-") > 0 &&
                file.indexOf(".json") > 0) {
                console.log("CLEARING: " + file);
                fs.remove("./cache/" + file);
            }
        }
    }
};

// STATIC HELPER FUNCTIONS. May become OO later.
function getTemplate(t) {
    var s = fs.read('templates/'+t+'.mustache');
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
   }
}

// This function takes a json representation of some data
// (for example, a disease and various associated genes, phenotypes)
// intended to be rendered by some template (e.g. disease.mustache) and
// adds additional functions or data to be used in the template.
function addCoreRenderers(info, type, id) {
    info['@context'] = "/conf/monarch-context.json"
    info.scripts = [
        {"url" : "/js/jquery-1.9.1.min.js"},
        {"url" : "/js/jquery-ui-1.10.3.custom.min.js"},
        {"url" : "http://netdna.bootstrapcdn.com/bootstrap/3.0.0-rc1/js/bootstrap.min.js"},
        {"url" : "/js/d3.min.js"},
        {"url" : "/js/parallel.js"},

    ];
    info.stylesheets = [
        {"url" : "http://netdna.bootstrapcdn.com/bootstrap/3.0.0-rc1/css/bootstrap.min.css"},
    ];
    if (id != null) {
        info.base_url = "/"+type+"/"+id;
        info.download = {
            "json" : genURL(type, id, 'json')
        };
        console.log("DN:"+JSON.stringify(info.download));
    }
    info.css = {};
    info.css.table = "table table-striped table-condensed";
    if (info.relationships != null) {
        info.ontNavBox = function(){ return genOntologyGraphInfo(type, id, info.relationships) };
    }
    info.includes = {};
    info.includes.navbar = Mustache.to_html(getTemplate('navbar'), {});
    info.includes.navlist = Mustache.to_html(getTemplate('navlist'), {});
    info.includes.navlistdisease = Mustache.to_html(getTemplate('navlistdisease'), {});
    info.includes.rightlist = Mustache.to_html(getTemplate('rightlist'), {});
}

// Takes JSON and returns an HTTP response, possibly translating
// the JSON into a requested format.
// Note that HTML is handled separately.
function formattedResults(info, fmt) {
    if (fmt == 'json') {
        return response.json(info);
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
        }
    }
    else {
        return {
            body: [ "Cannot handle format/extension: "+fmt],
            status: 500
        }
    }
}


////////////////////////////////////////
// CONTROLLER
//

// ROOT
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
   }
});

// SEARCH
// currently searches over ontologies using OQ
app.get('/search/:term?.:fmt?', function(request, term, fmt) {
    if (request.params.search_term != null) {
        term = request.params.search_term;
    }
    var results = engine.searchOverOntologies(term);
    var info =
        {
            results: results
        };
    if (fmt != null) {
        return formattedResults(info, fmt);
    }

    // HTML
    addCoreRenderers(info, 'search', term);
    
    // adorn object with rendering functions
    info.resultsTable = function() {return genTableOfSearchResults(info.results)} ;

    return response.html(Mustache.to_html(getTemplate('search_results'), info));    
});

// DISEASE - Root page
app.get('/disease', function(request) {
    return staticTemplate('disease_main');
});

// DISEASE PAGE
// Status: working but needs work
app.get('/disease/:id.:fmt?', function(request, id, fmt) {
    var newId = engine.resolveClassId(id);
    if (newId != id) {
        console.log("redirecting: "+id+" ==> "+newId);
        return response.redirect(genURL('disease',newId));
    }

    var info = engine.fetchDiseaseInfo(id); 
    if (fmt != null) {
        return formattedResults(info, fmt);
    }

    // HTML
    addCoreRenderers(info, 'disease', id);
    
    // adorn object with rendering functions
    info.phenotypeTable = function() {return genTableOfDiseasePhenotypeAssociations(info.phenotype_associations)} ;
    info.geneTable = function() {return genTableOfDiseaseGeneAssociations(info.gene_associations)} ;
    info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;
    info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models)} ;
    info.simTable = function() {return genTableOfSimilarDiseases(info.sim)} ;

    return response.html(Mustache.to_html(getTemplate('disease'), info));
});

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
        return formattedResults(sectionInfo, fmt);
    }
    else {
        return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
    }
});


app.get('/phenotype', function(request) {
    return staticTemplate('phenotype_main');
});

// Status: working but needs work
app.get('/phenotype/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchPhenotypeInfo(id); 
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }

    addCoreRenderers(info, 'phenotype', id);
    
    // adorn object with rendering functions
    info.diseaseTable = function() {return genTableOfDiseasePhenotypeAssociations(info.disease_associations)} ;
    info.geneTable = function() {return genTableOfDiseaseGeneAssociations(info.gene_associations)} ;
    //info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;
    info.genotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.genotype_associations)} ;
    info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models)} ;
    info.simTable = function() {return genTableOfSimilarDiseases(info.sim)} ;

    return response.html(Mustache.to_html(getTemplate('phenotype'), info));
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
        return formattedResults(sectionInfo, fmt);
    }
    else {
        return response.error("plain HTML does not work for page sections. Please append .json or .rdf to URL");
    }
});

// Status: super-prototypey, this is a good project for the geno modelers
app.get('/genotype/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchGenotypeInfo(id); 
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }

    addCoreRenderers(info, 'genotype', id);
    
    // adorn object with rendering functions
    info.phenotypeTable = function() {return genTableOfGenotypePhenotypeAssociations(info.phenotype_associations)} ;

    return response.html(Mustache.to_html(getTemplate('genotype'), info));
});

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
        return formattedResults(sectionInfo, fmt);
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
    var info = engine.fetchGeneInfo(id); 
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }
    
    // adorn object with rendering functions
    info.diseaseTable = function() {return genTableOfDiseaseGeneAssociations(info.disease_associations)} ;
    //info.phenotypeTable = function() {return genTableOGenePhenotypeAssociations(info.phenotype_associations)} ;
    //info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;

    return response.html(Mustache.to_html(getTemplate('gene'), info));
});

app.get('/model', function(request) {
    return staticTemplate('model_main');
});

// Status: STUB
app.get('/model/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchModelInfo(id); 
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }
    
    // adorn object with rendering functions
    //info.diseaseTable = function() {return genTableOfDiseaseGeneAssociations(info.disease_associations)} ;
    //info.phenotypeTable = function() {return genTableOGenePhenotypeAssociations(info.phenotype_associations)} ;
    //info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;

    return response.html(Mustache.to_html(getTemplate('model'), info));
});

// Status: STUB
// note we hardcode this for now
app.get('/phenome/Homo_sapiens.gff3', function(request, id, fmt) {
    
    var url = 'http://beta.neuinfo.org/services/v1/federation/data/nlx_152525-9.tsv?q=*&offset=0'

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
        if (fmt == 'json') {
            return response.json(info);
        }
    }
    
    // TODO - we may not need an HTML version
    //return response.html(Mustache.to_html(getTemplate('comparison'), info));
});

// E.g. /multicompare/OMIM_143100/MGI_3664660+MGI_nnn+MGI_mmmm.json
app.get('/multicompare/:x/:y.:fmt?', function(request, x, y, fmt) {
    var ys = y.split("+");
    var info = engine.fetchAttributeMultiComparisonMatrix(x, ys); 
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }
    
    // TODO - we may not need an HTML version
    //return response.html(Mustache.to_html(getTemplate('comparison'), info));
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
            return response.json(info);
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
        if (fmt == 'json') {
            return response.json(info);
        }
    }

    addCoreRenderers(info, 'anatomy', id);
    
    // adorn object with rendering functions
    info.expressionTable = function() {return genTableOfGeneExpressionAssocations(info.gene_associations)} ;
    //info.diseaseTable = function() {return genTableOfDiseaseGeneAssociations(info.disease_associations)} ;
    //info.phenotypeTable = function() {return genTableOGenePhenotypeAssociations(info.phenotype_associations)} ;
    //info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;

    return response.html(Mustache.to_html(getTemplate('anatomy'), info));
});

app.get('/analyze/:datatype.:fmt?', function(request, datatype, fmt) {
    var target = null;
    var info = {datatype: datatype, results:[]};
    var limit = 1000;
    if (request.params.input_items != null) {
        console.log("Request: "+request.params.input_items);
        console.log("Request Type: "+ typeof request.params.input_items);
        var input_items = request.params.input_items.split(/[\s,]+/);
        console.log("|Input| = "+input_items.length);
        console.log("Input: "+input_items);
        input_items = engine.mapIdentifiersToPhenotypes( input_items );
        limit = request.params.limit;

        resultObj = engine.searchByAttributeSet(input_items, target, limit);
        info.results = resultObj.results;
        console.log("ResultsInput: "+info.results.length);
        //info.input_items = resultObj.query_IRIs;
        info.input_items = input_items.join("\n");

    }
    else {
        // default - first 20 from MGI:101761 
        info.input_items = [
            'MP:0000788',
            'MP:0000822',
            'MP:0000914',
            'MP:0000929',
            'MP:0000930',
            'MP:0001286',
            'MP:0001393',
            'MP:0001688',
            'MP:0001698',
            'MP:0001732',
            'MP:0001787',
            'MP:0002064',
            'MP:0002083',
            'MP:0002151',
            'MP:0002950',
            'MP:0003012',
            'MP:0003424',
            'MP:0003651',
            'MP:0004948',
            'MP:0005657',
        ].join("\n");
    }
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }
    info.limit = limit;

    addCoreRenderers(info, 'analyze', datatype);
    info.resultsTable = function() {return genTableOfAnalysisSearchResults(info.results)} ;    

    return response.html(Mustache.to_html(getTemplate('analyze'), info));
});



// in theory anyone could access this and clear our cache slowing things down.... 
// we should make this authorized, not really a concern right now though
app.get('/admin/clear-cache', function(request) {
    engine.cache.clear();
    return response.html("Cleared!");
});

// INITIALIZATION
// Can set port from command line. E.g. --port 8080
if (require.main == module) {
   require('ringo/httpserver').main(module.id);
}
