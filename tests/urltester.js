/* Test: urltester.js

   This tests a set of URLs required for Monarch.

   TODO:
    - improve XML tests (OntoQuest)
    - allow configurable switching between beta/production URLs

    To run:

    > ringo tests/urltester.js -h

 */

var env = require('serverenv.js');
var testCommon = require('./test-common.js');


if (env.isRingoJS()) {
    var httpclient = require('ringo/httpclient');
    var system = require('system');
    var Parser = require('ringo/args').Parser;
}
else {
    var AsyncRequest = require('request');
    var WaitFor = require('wait.for');
}


// list of cfgs to load
var cfgs =
    [
        "urltest_cfg.js"
    ];

var version = null; // alpha, beta or productions
var components = null;  // list of components to be tested. Defaults to all
var urlToTest = null;   // set if only a single URL is to be tested

// test ALL configs
exports.testAll = function() {
    var testFailed = false;

    for (var k in cfgs) {
        testFailed |= !testCfgFile(cfgs[k]);
    }

    return !testFailed;
};

var testCfgFile = function(fn) {
    var testFailed = false;
    var urls = [];

    try {
        urls = eval(env.fs_readFileSync("tests/"+fn) + '');
    }
    catch(msg) {
        console.error("Cannot parse: "+fn);
        if (env.isRingoJS()) {
            var stm = require("ringo/logging").getScriptStack(msg);
        }
        else {
            var stm = 'StackTrace NYI for NodeJS';
        }
        console.error(msg);
        console.error(stm);
        return false;   // Indicate a test failure
    }
    for (var k in urls) {
        var url = urls[k];
        //console.log('urls ', k, ' [k]:', JSON.stringify(url));
        testFailed |= !testUrl(url);
    }

    return !testFailed;
}

// test a particular URL, check if returns expected results
var testUrl = function(urlinfo) {
    var testFailed = false;
    var url = urlinfo.url;
    var component = urlinfo.component;
    var expects = urlinfo.expects;

    if (components != null) {
        if (components.indexOf(component) == -1) {
            console.log("Skipping test on: "+url);
            return true;
        }
    }
    if (urlToTest != null) {
        if (url != urlToTest) {
            console.log("Skipping test on: "+url);
            return true;
        }
    }

    url = modifyUrlForComponent(url, component);

    console.log("Testing URL: "+url);
    console.log(JSON.stringify(urlinfo, ' ', null));
    var date = new Date();
    var t1 = date.getTime();

    if (env.isRingoJS()) {
        var x = httpclient.get(url);
    }
    else {
        var requestResult = WaitFor.for(AsyncRequest.get, url);
        //console.log('requestResult:', requestResult);
        requestResult.content = requestResult.body + '';
        var x = requestResult;
    }

    date = new Date();
    var t2 = date.getTime();
    var td = t2-t1;
    console.log("TIME\t"+component+"\t"+url+"\t"+td);
    console.log("Status: " + x.status);
    if (urlinfo.maxTimeMilliseconds != null) {
        if (td > urlinfo.maxTimeMilliseconds) {
            console.warn("TIME_EXCEEDS_EXPECTED: Call to "+url+" takes too long: "+td+" ms");
            //assert.fail("Call to "+url+" takes too long: "+td+" ms");
        }
    }
    if (expects.status != null) {
        testFailed |= !testCommon.assert(
                        "expects.status === x.status",
                        expects.status === x.status);
    }
    if (expects.status == null && x.status == 500) {
        console.warn("Received a 500");
        console.warn("DEBUG:"+x.content);
        testFailed |= !testCommon.assert(
                        "x.status !== 500",
                        x.status !== 500);
        return false;   // no point testing further
    }

    var resultObj = null;
    if (expects.format != null) {
        var rawContent = x.content;

        if (expects.raw_contains != null) {
            var strings = listify(expects.raw_contains);
            strings.forEach(function(s) {
                console.log("Checking for presence of string: "+s);
                //assert.isTrue(rawContent.indexOf(s) > -1);
                testFailed |= !testCommon.assert(
                                "rawContent.indexOf(s) >= 0",
                                rawContent.indexOf(s) >= 0);
            });
        }

        if (expects.raw_not_contains != null) {
            var strings = expects.raw_not_contains.push == null ? [expects.raw_not_contains] : expects.raw_not_contains; // listify
            strings.forEach(function(s) {
                console.log("Checking for presence of string: "+s);
                //assert.isTrue(rawContent.indexOf(s) > -1);
                testFailed |= !testCommon.assert(
                                "rawContent.indexOf(s) >= 0",
                                rawContent.indexOf(s) >= 0);
            });
        }

        if (expects.format == 'json') {
            resultObj = JSON.parse(rawContent);
        }
        else if (expects.format == 'xml') {
            resultObj =  new XML(rawContent.replace("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>",""));
        }
        else if (expects.format == 'html') {
            console.warn("ignoring html");
        }
        else {
            console.warn("TODO: "+expects.format);
        }
    }

    if (resultObj != null) {
        var results = null;
        if (component == 'vocabulary') {
            results = resultObj;
        }
        else if (component == 'federation') {
            results = resultObj.result.result; // yes this looks odd, but this is how fed returns data
            //console.log("RESULTS "+results);
        }
        else if (component == 'federation-search') {
            //results = resultObj;
            results = [resultObj.query.clauses];
            //console.log("RESULTS "+ results);
        }
        else if (component == 'scigraph') {
            results = [resultObj.list];
        }
        else if (component == 'ontoquest') {
            // TODO - OQ XML layered on JSON is complex - best just do raw checks for now
            results = resultObj.data;
        }
        else if (component == 'monarch') {
            var subcomponent = urlinfo.subcomponent;
            if (subcomponent == 'simsearch') {
                results = [resultObj];
            }
            else {
                results = [resultObj];
                //console.warn("Not implemented: "+ subcomponent);
            }
        }
        else {
            console.warn("??"+component);
            results = resultObj;
        }
        console.log("# results: "+results.length);
        testFailed |= !testResults(urlinfo, results);
    }

    return !testFailed;
}

var testResults = function(urlinfo, results) {
    var testFailed = false;

    var expects = urlinfo.expects;

    if (expects.min_results != null) {
        console.log("Expects: min_results = "+expects.min_results+" Actual #results="+results.length);
        testFailed |= !testCommon.assert(
                        "results.length >= expects.min_results",
                        results.length >= expects.min_results);
    }
    if (expects.max_results != null) {
        console.log("Expects: max_results = "+expects.max_results+" Actual #results="+results.length);
        testFailed |= !testCommon.assert(
                        "results.length <= expects.max_results",
                        results.length <= expects.max_results);
    }
    if (expects.must_contain != null) {
        console.log("Expects: match = "+JSON.stringify(expects.must_contain, null, ' '));
        listify(expects.must_contain).forEach(
            function(matchObj) {
                var matches = results.filter(function(r) { return matchesQuery(r, matchObj) });
                if (matches.length == 0) {
                    console.error("ACTUAL = "+JSON.stringify(results, null, ' '));
                }
                testFailed |= !testCommon.assert(
                                "matches.length !== 0",
                                matches.length !== 0);
            });
    }
    if (expects.must_not_contain != null) {
        console.log("Expects: NO match = "+JSON.stringify(expects.must_not_contain, null, ' '));
        listify(expects.must_not_contain).forEach(
            function(matchObj) {
                var matches = results.filter(function(r) { return matchesQuery(r, matchObj) });
                testFailed |= !testCommon.assert(
                                "matches.length === 0",
                                matches.length === 0);
            });
    }

    return !testFailed;
}

var matchesQuery = function(obj, pattern) {
    //console.log("    MQ(OBJ) = "+JSON.stringify(obj, null, ' '));
    //console.log("    MQ(PATTERN) = "+JSON.stringify(pattern, null, ' '));
    // if the object is a list, only one element has to match
    if (obj.push != null) {
        var matches = obj.filter(function(r) { return matchesQuery(r, pattern) } );
        return matches.length > 0;
    }
    for (var k in pattern) {
        //console.log("    T ? "+obj[k]+" == "+pattern[k]);
        if (obj[k] == null) {
            return false;
        }
        if (typeof pattern[k] == 'object') {
            // recurse
            if (! matchesQuery(obj[k], pattern[k])) {
                return false;
            }
        }
        else {
            if ( obj[k] != pattern[k] ) {
                return false;
            }
        }
        //console.log("    OK "+k);
    }
    return true;
}

// this is a fairly hacky (and incomplete) way of translating the hardcoded beta URLs to production or
// alpha.
// see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#
//
// Consider using webapp_launcher to select the correct configuration
var modifyUrlForComponent = function(url, component) {
    if (version == null) {
        return url;
    }
    if (component == 'federation' || component == 'vocabulary') {
        if (version == 'alpha') {
            return url.replace("beta.", "alpha.");
        }
        else if (version == 'production') {
            return url.replace("http://beta.neuinfo.org/services/v1/", "http://neuinfo.org/servicesv1/v1/");
        }
        else if (version == 'beta') {
            // default
        }
        else {
            console.warn("UNKNOWN: "+version);
            env.exit(-1);
        }
    }
    else if (component == 'ontoquest') {
        return url.replace("http://nif-services-stage.neuinfo.org/ontoquest-lamhdi", "http://services.monarchinitiative.org/ontoquest");
    }
    return url;
}

function listify(x) {
    return x.push == null ? [x] : x;
}

if (require.main == module) {
    if (env.isRingoJS()) {
        var httpclient = require('ringo/httpclient');

        var script = system.args.shift();
        console.log("ARGS="+system.args);
        var parser = new Parser(system.args);
        parser.addOption('h', 'help', null, 'Display help');
        parser.addOption('c', 'components', 'String', 'comma separated list of components. "ALL" for all');
        parser.addOption('s', 'setup', 'String', 'one of: alpha, beta, production');
        parser.addOption('u', 'url', 'URL', 'URL to test');

        var options = parser.parse(system.args);
        if (options.help) {
            print("Usage: ringo OPTIONS tests/urltester.js\n");
            print("Runs URL tests");
            print("\nOptions:");
            print(parser.help());
            print("\n\n\
Example:\n\
# Tests vocabulary component\n\
ringo -c vocabulary tests/urltester.js\n\
\n\
Example:\n\
# Tests federation component on alpha\n\
ringo -c vocabulary -s alpha  tests/urltester.js\n\
\n\
Example:\n\
# all tests\
ringo  -c vocabulary tests/urltester.js\n\
");
            system.exit('-1');
        }
    }
    else {
        var AsyncRequest = require('request');
        var WaitFor = require('wait.for');

        options = {
            components: 'ALL'
        };
    }

    console.log("options.components = " + options.components);
    if (options.url != null) {
        urlToTest = options.url;
    }
    if (options.components != null) {
        console.log("SETTING = " + options.components);
        components = options.components.split(",");
        if (components == 'ALL') {
            components = null;
        }
    }
    if (components === null) {
        components = [
            'vocabulary',
            'federation',
            'ontoquest'
        ];
    }
    console.log("Components = " + components);

    version = options.setup;
    console.log("Version = " + version);

    //system.args.forEach(function(fn) { print(fn) });
    testCommon.runTests(exports);
}
