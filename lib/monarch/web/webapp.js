/*

  Monarch WebApp

  See the RingoJS and Stick documentation for details on the approach.

  After some helper functions are declared, this consists of mappings of URL patterns to queries + visualization

 */

var stick = require('stick');
var Mustache = require('ringo/mustache');
var fs = require('fs');
var response = require('ringo/jsgi/response');

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
        require('ringo/subprocess').command("rm ./cache/*/key-*.json");
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

function addCoreRenderers(info, type, id) {
    info.scripts = [
        {"url" : "/js/jquery-1.9.1.min.js"},
        {"url" : "/js/jquery-ui-1.10.3.custom.min.js"},
        {"url" : "http://netdna.bootstrapcdn.com/bootstrap/3.0.0-rc1/js/bootstrap.min.js"},
        //{"url" : "http://twitter.github.com/bootstrap/assets/js/bootstrap-dropdown.js"},
        // ADD MORE HERE
    ];
    info.stylesheets = [
        {"url" : "http://netdna.bootstrapcdn.com/bootstrap/3.0.0-rc1/css/bootstrap.min.css"},
        //{"url" : "http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-combined.no-icons.min.css"},
        // ADD MORE HERE
    ];
    if (id != null) {
        info.download = {
            "json" : genURL(type, id, 'json')
        };
        console.log("DN:"+JSON.stringify(info.download));
    }
    info.css = {};
    //info.css.table = "table table-striped table-bordered";
    info.css.table = "table table-striped table-condensed";
    if (info.relationships != null) {
        info.ontNavBox = function(){ return genOntologyGraphInfo(type, id, info.relationships) };
    }
    info.includes = {};
    info.includes.navbar = Mustache.to_html(getTemplate('navbar'), {});
    info.includes.navlist = Mustache.to_html(getTemplate('navlist'), {});
    info.includes.rightlist = Mustache.to_html(getTemplate('rightlist'), {});
}

////////////////////////////////////////
// CONTROLLER
//

app.get('/help', function(request) {
    var info = {};
    addCoreRenderers(info);
    return response.html(Mustache.to_html(getTemplate('help'), info));
});

app.get('/page/:page', function(request,page) {
    var info = {};
    addCoreRenderers(info);
    return response.html(Mustache.to_html(getTemplate('page/'+page), info));
});

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

/*
app.get('/docs/:page', function(request,page) {
    return serveDirect('docs',page,'text/html');
});
// better way of doing this?
app.get('/docs/:page/:subpage', function(request,page,subpage) {
    return serveDirect('docs',page+"/"+subpage,'text/html');
});
*/

app.get('/css/:page', function(request,page) {
    return serveDirect('css',page,'text/css');
});
app.get('/js/:page', function(request,page) {
   return serveDirect('js',page,'text/plain');
});
app.get('/image/:page', function(request,page) {
    var s = fs.read('./image/'+page, {binary:true});
    return {
      body: [s],
      headers: {'Content-Type': 'image/png'},
      status: 200
   }
});

app.get('/', function(request) {
    var info = {};
    addCoreRenderers(info);
    return response.html(Mustache.to_html(getTemplate('main'), info));
});

app.get('/search/:term?.:fmt?', function(request, term, fmt) {
    for (var k in request) {
        console.log(k + " : "+request[k]);
    }
    if (request.params.search_term != null) {
        term = request.params.search_term;
    }
    var results = engine.searchOverOntologies(term);
    var info =
        {
            results: results
        };
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }

    addCoreRenderers(info, 'search', term);
    
    // adorn object with rendering functions
    info.resultsTable = function() {return genTableOfSearchResults(info.results)} ;

    return response.html(Mustache.to_html(getTemplate('search_results'), info));    
});

app.get('/disease', function(request) {
    return staticTemplate('disease_main');
});

// Status: working but needs work
app.get('/disease/:id.:fmt?', function(request, id, fmt) {
    var newId = engine.resolveClassId(id);
    if (newId != id) {
        console.log("redirecting: "+id+" ==> "+newId);
        return response.redirect(genURL('disease',newId));
    }

    var info = engine.fetchDiseaseInfo(id); 
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }

    addCoreRenderers(info, 'disease', id);
    
    // adorn object with rendering functions
    info.phenotypeTable = function() {return genTableOfDiseasePhenotypeAssociations(info.phenotype_associations)} ;
    info.geneTable = function() {return genTableOfDiseaseGeneAssociations(info.gene_associations)} ;
    info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;
    info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models)} ;
    info.simTable = function() {return genTableOfSimilarDiseases(info.sim)} ;

    return response.html(Mustache.to_html(getTemplate('disease'), info));
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
    info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;
    info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models)} ;
    info.simTable = function() {return genTableOfSimilarDiseases(info.sim)} ;

    return response.html(Mustache.to_html(getTemplate('phenotype'), info));
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

app.get('/class', function(request) {
    return staticTemplate('class_main');
});

// generic ontology view - most often this will be overridden, e.g. a disease class
// Status: STUB
app.get('/class/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchClassInfo(id);  // OQ
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
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

app.get('/analyze/:datatype', function(request, datatype) {

    var info = {datatype: datatype};

    addCoreRenderers(info, 'analyze', datatype);
    
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
