var stick = require('stick');
var Mustache = require('ringo/mustache');
var fs = require('fs');

var app = exports.app = new stick.Application();
app.configure('route');

// note: in future this may conform to CommonJS and be 'require'd
var engine = new bbop.monarch.Engine();

// SETUP
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

function addCoreRenderers(info) {
    info.scripts = [
        {"url" : "/js/jquery-ui-1.10.3.custom.min.js"},
        // ADD MORE HERE
    ];
    info.stylesheets = [
        {"url" : "/css/formatting.css"},
        // ADD MORE HERE
    ];
}

// CONTROLLER
app.get('/help', function(request) {
   return serveStatic('page','help.html','text/html');
});

app.get('/css/:page', function(request,page) {
   return serveStatic('css',page,'text/html');
});
app.get('/js/:page', function(request,page) {
   return serveStatic('js',page,'text/html');
});

app.get('/disease/:id/json', function(request, id) {
    var info = engine.fetchDiseaseInfo(id); 
    var payload = JSON.stringify(info);
    
   return {
      body: ['Hello '+payload],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

app.get('/disease/:id', function(request, id) {
    var info = engine.fetchDiseaseInfo(id); 

    addCoreRenderers(info);
    
    // adorn object with rendering functions
    info.phenotypeTable = function() {return genTableOfDiseasePhenotypeAssociations(info.phenotype_associations)} ;
    info.geneTable = function() {return genTableOfDiseaseGeneAssociations(info.gene_associations)} ;
    info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;
    info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models)} ;

    return {
      body: [Mustache.to_html(getTemplate('disease'), info) ],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

app.get('/phenotype/:id', function(request, id) {
    var info = engine.fetchPhenotypeInfo(id); 

    addCoreRenderers(info);
    
    // adorn object with rendering functions
    info.diseaseTable = function() {return genTableOfDiseasePhenotypeAssociations(info.disease_associations)} ;
    info.geneTable = function() {return genTableOfDiseaseGeneAssociations(info.gene_associations)} ;
    info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;
    info.modelTable = function() {return genTableOfDiseaseModelAssociations(info.models)} ;

    return {
      body: [Mustache.to_html(getTemplate('phenotype'), info) ],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

app.get('/gene/:id', function(request, id) {
    var info = engine.fetchGeneInfo(id); 
    
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

app.get('/model/:id', function(request, id) {
    var info = engine.fetchModelInfo(id); 
    
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
app.get('/model/:id', function(request, id) {
    var info = engine.fetchClassInfo(id);  // OQ
    
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

if (require.main == module) {
   require('ringo/httpserver').main(module.id);
}
