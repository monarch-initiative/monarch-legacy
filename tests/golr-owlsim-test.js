/* Test: owlsim-test.js

   Tests all dipper/golr phenotypes with owlsim
   These are functional tests using the monarch API
   
   To run:
   NODE_PATH=./node-modules:./modules:./lib/monarch node tests/golr-owlsim-test.js

 */
var env = require('serverenv.js');
var bbop = require('api.js').bbop;
var testCommon = require('./test-common.js');
var assert = require("assert");
var fs = require('fs');
var setup;
var engine;


var testGolrPhenotypesWithOwlSim = function (outputFile, phenotypeRegex) {
        
    var golrConf = new bbop.golr.conf(engine.config.golr);
    var golrServer = engine.config.golr_url;
    var golrManager = new bbop.golr.manager.nodejs(golrServer, golrConf);
    fs.openSync(outputFile, 'w+');
    
    // We don't need an OR filter as phenotypes are always objects
    //var phenotype_filter = 'subject_category:\"phenotype\" OR object_category:\"phenotype\"';
    //var query_filter = 'object:WBPhenotype* OR subject:WBPhenotype*';
    var phenotype_filter = 'object_category:\"phenotype\"';
    var query_filter = 'object:' + phenotypeRegex;
    var limit = 1000;
    
    golrManager.add_query_filter_as_string(phenotype_filter);
    golrManager.set_query(query_filter);
    golrManager.set_results_count(limit);
    var golrResponse;
    var paging_has_next = true;
    var url = golrManager.search();
    var phenotype_table = {};
    
    // Note, there may be a better way than getting every document
    // using facets, see fetchAssociationCount() in the api as an example
   
    do {
        var raw = engine.fetchUrl(url);
        var jsonData = JSON.parse(raw);
        golrResponse = new bbop.golr.response(jsonData);
        
        golrResponse.documents().forEach(function(doc){ 
            phenotype_table[doc.object] = 1;
        });
        
        paging_has_next = golrResponse.paging_next_p();
        if (paging_has_next) {
            url = golrManager.page_next();
        }
        
        //log total document count
        if (!(golrManager.get_page_start() % 10000)) {
            console.log("Finished parsing " + golrManager.get_page_start() + " records")
        }
    } while (paging_has_next)
    console.log("Finished parsing all documents: " + golrResponse.total_documents() + " records")
    
    //info.results = engine.searchByPhenotypeProfile(input_items,target_species,null,limit);
    for (key in phenotype_table) {
        var query = [key];
        var owlSimResults = engine.searchByPhenotypeProfile(query);
        if (!('b' in owlSimResults)) {
            fs.appendFileSync(outputFile, key+'\n');
        }
    }
};

exports.testWormBasePhenotypes = function() {
    var outFile = './wormbase-ids.txt';
    var phenotype_match = 'WBPhenotype*';
    testGolrPhenotypesWithOwlSim(outFile, phenotype_match);
    //stay true
    return testCommon.assert(1,1);
};

exports.testFlyBasePhenotypes = function() {
    var outFile = './flybase-ids.txt';
    var phenotype_match = 'FBcv*';
    testGolrPhenotypesWithOwlSim(outFile, phenotype_match);
    //stay true
    return testCommon.assert(1,1);
};

if (require.main == module) {
    
    console.log("CLI parsing NYI for NodeJS");
    options = {
        setup: null
    };
    setup = options.setup;
    var conf = "conf/server_config_dev.json";
    var golrConf = "conf/golr-conf.json";

    if (setup != null) {
        if (setup == 'production') {
            conf = "conf/server_config_production.json";
        }
    }

    // see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#
    bbop.monarch.defaultConfig = env.readJSON(conf);
    bbop.monarch.golrConfig = env.readJSON(golrConf);

    engine = new bbop.monarch.Engine();
    engine.isProduction = function() { return false }; // always log in test mode

    testCommon.runTests(exports);
}