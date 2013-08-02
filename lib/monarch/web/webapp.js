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

// note: in future this may conform to CommonJS and be 'require'd
var engine = new bbop.monarch.Engine();

// note: this will probably move to it's own OO module
engine.cache = {
    fetch: function(tbl, key, val) {
        var path = "./cache/"+tbl+"/key-"+key+".json";
        console.log("R lookup:"+path);
        if (fs.exists(path)) {
            return JSON.parse(fs.read(path));
        }
        return null;
    },
    store: function(tbl, key, val) {
        var path = "./cache/"+tbl+"/key-"+key+".json";
        console.log("S lookup:"+path);
        fs.write(path, JSON.stringify(val));
    }
};

// STATIC HELPER FUNCTIONS. May become OO later.
function getTemplate(t) {
    var s = fs.read('templates/'+t+'.mustache');
    return s;
}

function serveStatic(loc,page,ctype) {
    var s = fs.read(loc+'/'+page);
    return {
      body: [Mustache.to_html(s,{})],
      headers: {'Content-Type': ctype},
      status: 200
   }
}

function addCoreRenderers(info, type, id) {
    info.scripts = [
        {"url" : "/js/jquery-ui-1.10.3.custom.min.js"},
        // ADD MORE HERE
    ];
    info.stylesheets = [
        {"url" : "/css/formatting.css"},
        // ADD MORE HERE
    ];
    if (id != null) {
        info.download = {
            "json" : genURL(type, id, 'json')
        };
        console.log("DN:"+JSON.stringify(info.download));
    }
        
}

////////////////////////////////////////
// CONTROLLER
//

app.get('/help', function(request) {
   return serveStatic('page','help.html','text/html');
});

app.get('/css/:page', function(request,page) {
   return serveStatic('css',page,'text/html');
});
app.get('/js/:page', function(request,page) {
   return serveStatic('js',page,'text/html');
});

//test
app.get('/test/:foo.:bar?', function(request,foo,bar) {
   return response.html(foo + " / " + bar);
});


// TEST
app.get('/disease/:id/json', function(request, id) {
    var info = engine.fetchDiseaseInfo(id); 
    var payload = JSON.stringify(info);
    
   return {
      body: ['Hello '+payload],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

// Status: working but needs work
app.get('/disease/:id.:fmt?', function(request, id, fmt) {
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
    //return {
    //body: [Mustache.to_html(getTemplate('disease'), info) ],
    //headers: {'Content-Type': 'text/html'},
    //status: 200
//}
});

// Status: working but needs work
app.get('/phenotype/:id.:fmt?', function(request, id, fmt) {
    var info = engine.fetchPhenotypeInfo(id); 
    if (fmt != null) {
        if (fmt == 'json') {
            return response.json(info);
        }
    }

    addCoreRenderers(info);
    
    // adorn object with rendering functions
    info.diseaseTable = function() {return genTableOfDiseasePhenotypeAssociations(info.disease_associations)} ;
    info.geneTable = function() {return genTableOfDiseaseGeneAssociations(info.gene_associations)} ;
    info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;
    info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models)} ;
    info.simTable = function() {return genTableOfSimilarDiseases(info.sim)} ;

    return {
      body: [Mustache.to_html(getTemplate('phenotype'), info) ],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
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

    return {
      body: [Mustache.to_html(getTemplate('gene'), info) ],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
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

    return {
      body: [Mustache.to_html(getTemplate('model'), info) ],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

// generic ontology view - most often this will be overridden, e.g. a disease class
// Status: STUB
app.get('/model/:id.:fmt?', function(request, id, fmt) {
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

    return {
      body: [Mustache.to_html(getTemplate('model'), info) ],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

// INITIALIZATION
// Can set port from command line. E.g. --port 8080
if (require.main == module) {
   require('ringo/httpserver').main(module.id);
}
