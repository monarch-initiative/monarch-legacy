var {Application} = require('stick');
var Mustache = require('ringo/mustache');

var e = new bbop.monarch.Engine();

var cfs = require('fs');
e.cache = {
    fetch: function(tbl, key, val) {
        var path = "./cache/"+tbl+"/key-"+key+".json";
        console.log("R lookup:"+path);
        if (cfs.exists(path)) {
            return JSON.parse(cfs.read(path));
        }
        return null;
    },
    store: function(tbl, key, val) {
        var path = "./cache/"+tbl+"/key-"+key+".json";
        console.log("S lookup:"+path);
        cfs.write(path, JSON.stringify(val));
    }
};

var app = exports.app = new Application();
app.configure('route');

function getTemplate(t) {
    var fs = require('fs');
    var s = fs.read('templates/'+t+'.mustache');
    return s;
}

app.get('/test/:a/:b', function(request, a, b) {
   return {
      body: [Mustache.to_html(getTemplate('test'), {a:a, b:b})],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

app.get('/hello', function(request) {
   return {
      body: ['<h1>Hello world</h1>'],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

app.get('/disease/:id/json', function(request, id) {
    var info = e.fetchDiseaseInfo(id); 
    var payload = JSON.stringify(info);
    
   return {
      body: ['Hello '+payload],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

app.get('/disease/:id', function(request, id) {
    var info = e.fetchDiseaseInfo(id); 
    
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
    var info = e.fetchPhenotypeInfo(id); 
    
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
    var info = e.fetchGeneInfo(id); 
    
    // adorn object with rendering functions
    info.diseaseTable = function() {return genTableOfDiseaseGeneAssociations(info.disease_associations)} ;
    info.phenotypeTable = function() {return genTableOfDiseasePhenotypeAssociations(info.phenotype_associations)} ;
    info.alleleTable = function() {return genTableOfDiseaseAlleleAssociations(info.alleles)} ;

    return {
      body: [Mustache.to_html(getTemplate('gene'), info) ],
      headers: {'Content-Type': 'text/html'},
      status: 200
   }
});

if (require.main == module) {
   require('ringo/httpserver').main(module.id);
}
