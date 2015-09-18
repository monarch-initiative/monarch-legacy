var env = require('serverenv.js');
var testCommon = require('./test-common.js');
var engine;

// feel free to add more here...
var classIds =
    [
        "DOID:14330", // PD
        "DOID:12358", // patulous eustachian tube
    ];

exports.testClassInfo = function() {
    var testFailed = false;

    classIds.forEach(
        function(id) {
            var resObj = engine.fetchClassInfo(id);
            console.log(JSON.stringify(resObj,' ',1));
            testFailed |= !testCommon.assert(
                "resObj.definitions.length > 0",
                resObj.definitions.length > 0);
            testFailed |= !testCommon.assert(
                "resObj.id.length > 0",
                resObj.id.length > 0);
            testFailed |= !testCommon.assert(
                "resObj.label.length > 0",
                resObj.label.length > 0);
            testFailed |= !testCommon.assert(
                "resObj.categories.indexOf('disease') > -1",
                resObj.categories.indexOf('disease') > -1);
        }
    );

    return !testFailed;
};

if (require.main == module) {
    engine = new testCommon.getTestEngine();
    testCommon.runTests(exports);
}
