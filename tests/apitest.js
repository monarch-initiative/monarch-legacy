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
        "NCBIGene:388552"
    ];

//Test fetchAssociations
exports.testFetchAssociations = function() {
    var testFailed = false;

    diseaseIds.forEach(
            function(id) {
                console.log("Fetching:"+id);
                var filter = [{field: 'subject_closure', value: id},
                              {field: 'object_category', value: 'phenotype'},
                              {field: 'subject_category', value: 'disease'}];
                var golrResponse = engine.fetchAssociations(filter, 10);

                var thisTestSucceeded = testCommon.assert(
                    "golrResponse._is_a === 'bbop-response-golr'",
                     golrResponse._is_a === 'bbop-response-golr');
                     console.log(golrResponse._is_a);
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
                var filter = [{field: 'subject_closure', value: id}];
                engine.fetchAssociations(filter, 1000);
            }
        );

    phenotypeIds.forEach(
            function(id) {
                console.log("Fetching:"+id);
                var filter = [{field: 'subject_closure', value: id}];
                engine.fetchAssociations(filter, 1000);
            }
        );
    return !testFailed;
};

// Test that NCBIGene:2989 is not a disease,
// see https://github.com/monarch-initiative/dipper/issues/356
exports.testGeneCategory = function() {
    var gene = "NCBIGene:2989";
    var filter = [
                  {field: 'subject_closure', value: gene},
                  {field: 'subject_category', value: 'disease'}
    ];
    var golrResponse = engine.fetchAssociations(filter, 10);
    var documents = golrResponse.documents();
    return testCommon.assertEqual(documents.length, 0);
};

// Make sure all genes have labels, see 
// https://github.com/monarch-initiative/monarch-app/issues/1341
exports.testGeneLabels = function() {
    var gene = "NCBIGene:4609";
    var filter = [
                  {field: 'subject_closure', value: gene},
                  {field: 'object_category', value: 'pathway'}
    ];
    var golrResponse = engine.fetchAssociations(filter, 50);
    var documents = golrResponse.documents();
    gene_labels = documents.filter(function(doc){return 'subject_label' in doc});
    return testCommon.assertEqual(gene_labels.length, documents.length);  
};

// Check that genes are showing up for variants on disease pages
// See https://github.com/monarch-initiative/monarch-app/issues/1343
exports.testVariantGeneOnDiseasePage = function() {
    var disease = "OMIM:182212";
    var filter = [
                  {field: 'object_closure', value: disease},
                  {field: 'subject_category', value: 'variant'},
                  {field: 'relation_closure', value: 'RO:0003303'}
    ];
    var golrResponse = engine.fetchAssociations(filter, 50);
    var documents = golrResponse.documents();
    docsWithGene = documents.filter(function(doc){return 'subject_gene' in doc;});
    return testCommon.assertEqual(docsWithGene.length, documents.length);  
};

if (require.main == module) {
    console.log("CLI parsing NYI for NodeJS");
    options = {
        setup: null
    };

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
