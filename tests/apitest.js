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
var testCommon = require('./test-common.js');

if (env.isRingoJS()) {
    var Parser = require('ringo/args').Parser;
    var system = require('system');
}
else {
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

//Test fetchAssociations
exports.testFetchAssociations = function() {
    var testFailed = false;
    var filter = [{field: 'object_category', value: 'phenotype'},
                  {field: 'subject_category', value: 'disease'}];

    diseaseIds.forEach(
            function(id) {
                console.log("Fetching:"+id);
                var golrResponse = engine.fetchAssociations(id, 'subject_closure', filter, 10);

                var thisTestSucceeded = testCommon.assert(
                    "golrResponse._is_a === 'bbop.golr.response'",
                     golrResponse._is_a === 'bbop.golr.response');
                testFailed |= !thisTestSucceeded;
                if (thisTestSucceeded) {
                    var firstDoc = golrResponse.documents()[0];
                    if (id === "DOID:14330") {
                        testFailed |= !testCommon.assert(
                                        "firstDoc.subject_category === 'disease'",
                                        firstDoc.subject_category === 'disease');
                    }
                }
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
    return !testFailed;
};

// Test that NCBIGene:2989 is not a disease,
// see https://github.com/monarch-initiative/dipper/issues/356
exports.testGeneCategory = function() {
    var gene = "NCBIGene:2989";
    var filter = [{field: 'subject_category', value: 'disease'}];
    var golrResponse = engine.fetchAssociations(gene, 'subject_closure', filter, 10);
    var documents = golrResponse.documents();
    return testCommon.assertEqual(documents.length, 0);
};

// Make sure all genes have labels, see 
// https://github.com/monarch-initiative/monarch-app/issues/1341
exports.testGeneLabels = function() {
    var hasLabel = true;
    var gene = "NCBIGene:4609";
    var filter = [{field: 'object_category', value: 'pathway'}];
    var golrResponse = engine.fetchAssociations(gene, 'subject_closure', filter, 50);
    var documents = golrResponse.documents();
    gene_labels = documents.filter(function(val){return val['subject_label'] != "";});
    return testCommon.assertEqual(gene_labels.length, documents.length);  
};

// Check that genes are showing up for variants on disease pages
// See https://github.com/monarch-initiative/monarch-app/issues/1343
exports.testVariantGeneOnDiseasePage = function() {
    var hasLabel = true;
    var disease = "OMIM:182212";
    var filter = [{field: 'subject_category', value: 'variant'}];
    var golrResponse = engine.fetchAssociations(disease, 'object_closure', filter, 50);
    var documents = golrResponse.documents();
    docsWithGene = documents.filter(function(val){return val['subject_gene'] != "";});
    return testCommon.assertEqual(docsWithGene.length, documents.length);  
};

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
    var conf = "conf/server_config_beta.json";
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
