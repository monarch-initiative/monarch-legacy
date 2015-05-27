/* Test: apitest.js

   Tests Monarch App API calls; this will indirectly test a number of services, including:

   - ontoquest
   - federation services and numerous views
   - owlsim

   Note that in all tests, the json object cache is bypassed. To test with caching, use
   urltester, which uses the web framework.

   To run:

    > ringo tests/apitest.js

 */

load('lib/monarch/api.js');
var Parser = require('ringo/args').Parser;
var system = require('system');
var assert = require("assert");
var fs = require('fs');
var engine;
var setup;
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

// feel free to add more here...
var diseaseIds =
    [
        "DOID:14330", // PD
        "OMIM:270400", // SLO
    ];

exports.testDiseaseBasic = function() {
    diseaseIds.forEach(
        function(id) {
            console.log("Fetching:"+id);
            var json = engine.fetchDiseaseInfo(id);
            // todo - check json
        }
    );
}


// feel free to add more here...
var phenotypeIds =
    [
        "HP:0000238", // Hydrocephalus
        "MP:0000913", // abnormal brain development
    ];

exports.testPhenotypeBasic = function() {
    phenotypeIds.forEach(
        function(id) {
            var json = engine.fetchPhenotypeInfo(id);
            // todo - check json
        }
    );
}


var geneIds =
    [
        "NCBIGene:388552", 
    ];
exports.testGeneBasic = function() {
    geneIds.forEach(
        function(id) {
            //var json = engine.fetchGeneInfo(id);
            // todo - check json
        }
    );
}


var pmids = [14581620, 20080219, 11912187];
exports.testLiteratureBasic = function() {
    var json = engine.fetchPubFromPMID(pmids);
    console.log(JSON.stringify(json));
    // todo - check json

}

//Test fetchAssociations
exports.testFetchAssociations = function() {
    var filter = {field: 'object_category', value: 'phenotype'};
    
    diseaseIds.forEach(
            function(id) {
                console.log("Fetching:"+id);
                engine.fetchAssociations(id, 'subject_closure', filter, 50000);
                engine.fetchAssociations(id, 'object_closure');
                engine.fetchAssociations(id, 'subject_closure', null, 10);
            }
    );
    
    geneIds.forEach(
            function(id) {
                console.log("Fetching:"+id);
                engine.fetchAssociations(id, 'subject_closure', filter, 50000);
                engine.fetchAssociations(id, 'object_closure');
                engine.fetchAssociations(id, 'subject_closure', null, 10);
            }
        );
    
    phenotypeIds.forEach(
            function(id) {
                console.log("Fetching:"+id);
                engine.fetchAssociations(id, 'subject_closure', filter, 50000);
                engine.fetchAssociations(id, 'object_closure');
                engine.fetchAssociations(id, 'subject_closure', null, 10);
            }
        );
}

if (require.main == module) {
    var script = system.args.shift();
    var parser = new Parser(system.args);
    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('s', 'setup', 'String', 'one of: beta, production');
    
    var options = parser.parse(system.args);
    if (options.help) {
        print("Usage: ringo OPTIONS tests/apitest.js\n");
        print("Runs API tests");
        print("\nOptions:");
	print(parser.help());
	system.exit('-1');
    }

    setup = options.setup;
    var conf = "conf/server_config_dev.json";
    var golrConf = "conf/golr-conf.json";

    if (setup != null) {
        if (setup == 'production') {
            conf = "conf/server_config_production.json";
        }
    }

    // see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#
    bbop.monarch.defaultConfig = JSON.parse(fs.read(conf));
    bbop.monarch.golrConfig = JSON.parse(fs.read(golrConf));

    engine = new bbop.monarch.Engine();
    engine.isProduction = function() { return false }; // always log in test mode

    var rtn = require("test").run(exports);
    print("Return code="+rtn);
    system.exit(rtn);
}
