load('tests/test-common.js');
var engine;

// feel free to add more here...
var classIds =
    [
        "DOID:14330", // PD
        "DOID_12358", // patulous eustachian tube
    ];

exports.testClassInfo = function() {
    classIds.forEach(
        function(id) {
            var resObj = engine.fetchClassInfo(id);
            console.log(JSON.stringify(resObj,' ',1));
            assert.isTrue(resObj.definitions.length > 0);
            assert.isTrue(resObj.id.length > 0);
            assert.isTrue(resObj.label.length > 0);
            assert.isTrue(resObj.category == 'disease');
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
