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
var env = require('serverenv.js');
var bbop = require('api.js').bbop;

if (env.isRingoJS()) {
    var Parser = require('ringo/args').Parser;
    var system = require('system');
}
else {
    var WaitFor = require('wait.for');
}

var assert = require("assert");
var fs = require('fs');
var engine;
var setup;

// feel free to add more here...
var diseaseIds =
    [
        "DOID:14330", // PD
        "OMIM:270400", // SLO
    ];

// feel free to add more here...
var phenotypeIds =
    [
        "HP:0000238", // Hydrocephalus
        "MP:0000913", // abnormal brain development
    ];

var geneIds =
    [
        "NCBIGene:388552", 
    ];

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
                engine.fetchAssociations(id, 'subject_closure', filter, 1000);
                engine.fetchAssociations(id, 'object_closure');
                engine.fetchAssociations(id, 'subject_closure', null, 10);
            }
    );
    
    geneIds.forEach(
            function(id) {
                console.log("Fetching:"+id);
                engine.fetchAssociations(id, 'subject_closure', filter, 1000);
                engine.fetchAssociations(id, 'object_closure');
                engine.fetchAssociations(id, 'subject_closure', null, 10);
            }
        );
    
    phenotypeIds.forEach(
            function(id) {
                console.log("Fetching:"+id);
                engine.fetchAssociations(id, 'subject_closure', filter, 1000);
                engine.fetchAssociations(id, 'object_closure');
                engine.fetchAssociations(id, 'subject_closure', null, 10);
            }
        );
}

if (require.main == module) {
    if (env.isRingoJS()) {
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
    }
    else {
        console.log("CLI parsing NYI for NodeJS");
        options = {
            setup: null
        };
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
    bbop.monarch.defaultConfig = env.readJSON(conf);
    bbop.monarch.golrConfig = env.readJSON(golrConf);

    engine = new bbop.monarch.Engine();
    engine.isProduction = function() { return false }; // always log in test mode

    if (env.isRingoJS()) {
        var rtn = require("test").run(exports);
        print("Return code="+rtn);
        system.exit(rtn);
    }
    else {
        WaitFor.launchFiber( function () {
            exports.testLiteratureBasic();
            exports.testFetchAssociations();
        });
    }
}
