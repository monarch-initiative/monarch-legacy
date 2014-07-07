load('tests/test-common.js');
var engine;

var pmids = [14581620, 20080219, 11912187];
exports.testLiteratureBasic = function() {
    var json = engine.fetchPubFromPMID(pmids);
    console.log(JSON.stringify(json));
    // todo - check json

}

if (require.main == module) {
    engine = new getTestEngine();

    var rtn = require("test").run(exports);
    print("Return code="+rtn);
    system.exit(rtn);
}



