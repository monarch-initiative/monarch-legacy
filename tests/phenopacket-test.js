/* Test: phenopacket-test.ks

   Tests that our phenopackets conform to schema
   
   To run:
   NODE_PATH=./node-modules:./modules:./lib/monarch node --harmony_destructuring tests/phenopacket-test.js

 */

var fs = require('fs');
var testCommon = require('./test-common.js');
var env = require('serverenv.js');
var bbop = require('api.js').bbop;
var phenoPacketBuilder = require('../lib/monarch/phenopacket-builder.js');
var engine;
var validator = require('is-my-json-valid');


exports.testPhenoPacketBuilder = function() {

    var test_params = {};
    test_params.fq =["subject_closure:\"ClinVarVariant:91577\"",
                     "object_category:\"phenotype\""];
    test_params.q = "*:*";
    test_params.personality = "variant_phenotype";

    var limit = 5000
    var response = engine.fetchSolrDocuments(test_params.q, test_params.fq, test_params.personality, limit);
    var phenopacket = phenoPacketBuilder.buildPhenoPacket(response, test_params.personality);
    
    var schema = JSON.parse(fs.readFileSync('./tests/resources/phenopacket-schema.json', 'utf8'));

    var validate = validator(schema, {
        verbose: true
    });
    
    if (validate(phenopacket.phenopacket) === false) {
       return testCommon.assert("Test that json is conformant to schema",
               validate(phenopacket.phenopacket));
    }
    
    // Change something to make it invalid
    phenopacket.phenopacket.phenotype_profile[0].phenotype.has_location = "";
    return testCommon.assert("Test that schema validator catches incorrect json",
            !validate(phenopacket.phenopacket));
    
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