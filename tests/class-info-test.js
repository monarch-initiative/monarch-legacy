load('tests/test-common.js');
var engine;

// feel free to add more here...
var classIds =
    [
        "DOID:14330", // PD
    ];

exports.testClassInfo = function() {
    classIds.forEach(
        function(id) {
            var resObj = engine.fetchClassInfo(id);
            console.log(JSON.stringify(resObj,' ',1));
            // todo - check json
            //assert.isTrue(resObj.resultCount > 100);
            //assert.isTrue(resObj.results.length > 100);
            
        }
    );
}


if (require.main == module) {
    engine = new getTestEngine();

    var rtn = require("test").run(exports);
    print("Return code="+rtn);
    system.exit(rtn);
}
