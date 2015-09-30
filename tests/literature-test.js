var env = require('serverenv.js');
var _ = require('underscore');
var testCommon = require('./test-common.js');
var engine;

var pmidsDesired = [14581620, 20080219, 11912187];
exports.testLiteratureBasic = function() {
    var json = engine.fetchPubFromPMID(pmidsDesired);
    // console.log(JSON.stringify(json));
    var pmidsFound = _.map(json, function (doc) {
    	return doc.pmid;
    });
    // console.log('pmidsFound:', pmidsFound);

    var pmidMissing = false;
    _.each(pmidsDesired, function (pmid) {
    	pmidMissing |= pmidsFound.indexOf(pmid) < 0;
    });

    return testCommon.assert("fetchPubFromPMID missing pmidsDesired", !pmidMissing);
};

if (require.main == module) {
    engine = new testCommon.getTestEngine();
    testCommon.runTests(exports);
}
